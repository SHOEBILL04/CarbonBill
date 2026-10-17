using System.Data;
using System.Globalization;
using CarbonBill.Modules.Recommendations.Domain;
using CarbonBill.Modules.Recommendations.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CarbonBill.Modules.Recommendations.Services;

public record AggregatedFacilityData(
    decimal AnnualElectricityKwh,
    decimal TotalElectricityCostBdt,
    decimal ElectricityTariffBdtPerKwh,
    decimal AnnualDieselLitres,
    decimal TotalDieselCostBdt,
    decimal DieselTariffBdtPerLitre,
    decimal AnnualGasM3,
    decimal TotalGasCostBdt,
    decimal GasTariffBdtPerM3,
    bool HasRealBills,
    int BillsCount,
    IReadOnlyList<string> ActiveFlagCodes,
    IReadOnlyList<string> ActiveFlagSummaries);

public interface IFacilityDataAggregator
{
    Task<AggregatedFacilityData> AggregateFacilityDataAsync(
        Guid orgId,
        FacilityProfile fallbackProfile,
        CancellationToken ct = default);
}

public class FacilityDataAggregator(
    RecommendationsDbContext dbContext,
    ILogger<FacilityDataAggregator> logger) : IFacilityDataAggregator
{
    public async Task<AggregatedFacilityData> AggregateFacilityDataAsync(
        Guid orgId,
        FacilityProfile fallbackProfile,
        CancellationToken ct = default)
    {
        var activeFlags = new List<string>();
        var flagSummaries = new List<string>();

        decimal annualKwh = fallbackProfile.BaselineMonthlyKwh * 12.0m;
        decimal totalElecCost = annualKwh * (fallbackProfile.ElectricityTariffBdtPerKwh > 0 ? fallbackProfile.ElectricityTariffBdtPerKwh : 10.50m);
        decimal elecTariff = fallbackProfile.ElectricityTariffBdtPerKwh > 0 ? fallbackProfile.ElectricityTariffBdtPerKwh : 10.50m;

        decimal annualDiesel = fallbackProfile.BaselineMonthlyDieselLitres * 12.0m;
        decimal totalDieselCost = annualDiesel * (fallbackProfile.DieselTariffBdtPerLitre > 0 ? fallbackProfile.DieselTariffBdtPerLitre : 108.00m);
        decimal dieselTariff = fallbackProfile.DieselTariffBdtPerLitre > 0 ? fallbackProfile.DieselTariffBdtPerLitre : 108.00m;

        decimal annualGas = fallbackProfile.BaselineMonthlyGasM3 * 12.0m;
        decimal totalGasCost = annualGas * (fallbackProfile.GasTariffBdtPerM3 > 0 ? fallbackProfile.GasTariffBdtPerM3 : 30.00m);
        decimal gasTariff = fallbackProfile.GasTariffBdtPerM3 > 0 ? fallbackProfile.GasTariffBdtPerM3 : 30.00m;

        bool hasRealBills = false;
        int totalBillsCount = 0;

        try
        {
            var conn = dbContext.Database.GetDbConnection();
            bool wasOpen = conn.State == ConnectionState.Open;
            if (!wasOpen)
            {
                await conn.OpenAsync(ct);
            }

            // 1. Query ActivityRecords for actual energy usage and costs
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = @"
                    SELECT ActivityType, StandardUnit, QuantityStandard, TotalCostBdt, UnitCostBdt, Period
                    FROM ActivityRecords
                    WHERE OrgId = @orgId COLLATE NOCASE;
                ";
                var p = cmd.CreateParameter();
                p.ParameterName = "@orgId";
                p.Value = orgId.ToString();
                cmd.Parameters.Add(p);

                var elecPeriods = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var dieselPeriods = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var gasPeriods = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                decimal liveElecQty = 0m, liveElecCost = 0m;
                decimal liveDieselQty = 0m, liveDieselCost = 0m;
                decimal liveGasQty = 0m, liveGasCost = 0m;

                using (var reader = await cmd.ExecuteReaderAsync(ct))
                {
                    while (await reader.ReadAsync(ct))
                    {
                        hasRealBills = true;
                        totalBillsCount++;

                        var actType = reader["ActivityType"]?.ToString() ?? "";
                        var unit = reader["StandardUnit"]?.ToString() ?? "";
                        var period = reader["Period"]?.ToString() ?? "";
                        decimal qty = reader["QuantityStandard"] != DBNull.Value ? Convert.ToDecimal(reader["QuantityStandard"], CultureInfo.InvariantCulture) : 0m;
                        decimal? cost = reader["TotalCostBdt"] != DBNull.Value ? Convert.ToDecimal(reader["TotalCostBdt"], CultureInfo.InvariantCulture) : null;

                        if (actType.Contains("elec", StringComparison.OrdinalIgnoreCase) || unit.Equals("kwh", StringComparison.OrdinalIgnoreCase))
                        {
                            liveElecQty += qty;
                            if (cost.HasValue) liveElecCost += cost.Value;
                            if (!string.IsNullOrWhiteSpace(period)) elecPeriods.Add(period);
                        }
                        else if (actType.Contains("diesel", StringComparison.OrdinalIgnoreCase) || unit.Equals("litre", StringComparison.OrdinalIgnoreCase) || unit.Equals("litres", StringComparison.OrdinalIgnoreCase))
                        {
                            liveDieselQty += qty;
                            if (cost.HasValue) liveDieselCost += cost.Value;
                            if (!string.IsNullOrWhiteSpace(period)) dieselPeriods.Add(period);
                        }
                        else if (actType.Contains("gas", StringComparison.OrdinalIgnoreCase) || unit.Equals("m3", StringComparison.OrdinalIgnoreCase))
                        {
                            liveGasQty += qty;
                            if (cost.HasValue) liveGasCost += cost.Value;
                            if (!string.IsNullOrWhiteSpace(period)) gasPeriods.Add(period);
                        }
                    }
                }

                // If real electricity bills exist, annualize them realistically
                if (liveElecQty > 0)
                {
                    int mCount = Math.Max(1, Math.Min(12, elecPeriods.Count));
                    annualKwh = Math.Round((liveElecQty / mCount) * 12.0m, 2);
                    if (liveElecCost > 0)
                    {
                        totalElecCost = Math.Round((liveElecCost / mCount) * 12.0m, 2);
                        elecTariff = Math.Round(liveElecCost / liveElecQty, 2);
                    }
                }

                // If real diesel bills exist, annualize them realistically
                if (liveDieselQty > 0)
                {
                    int mCount = Math.Max(1, Math.Min(12, dieselPeriods.Count));
                    annualDiesel = Math.Round((liveDieselQty / mCount) * 12.0m, 2);
                    if (liveDieselCost > 0)
                    {
                        totalDieselCost = Math.Round((liveDieselCost / mCount) * 12.0m, 2);
                        dieselTariff = Math.Round(liveDieselCost / liveDieselQty, 2);
                    }
                }

                // If real gas bills exist, annualize them realistically
                if (liveGasQty > 0)
                {
                    int mCount = Math.Max(1, Math.Min(12, gasPeriods.Count));
                    annualGas = Math.Round((liveGasQty / mCount) * 12.0m, 2);
                    if (liveGasCost > 0)
                    {
                        totalGasCost = Math.Round((liveGasCost / mCount) * 12.0m, 2);
                        gasTariff = Math.Round(liveGasCost / liveGasQty, 2);
                    }
                }
            }

            // 2. Query Active Flags from Flags table
            using (var cmdFlags = conn.CreateCommand())
            {
                cmdFlags.CommandText = @"
                    SELECT RuleCode, Severity, Period, ExplanationEn, ExplanationBn
                    FROM Flags
                    WHERE OrgId = @orgId COLLATE NOCASE AND State IN ('Open', 'Acknowledged');
                ";
                var p = cmdFlags.CreateParameter();
                p.ParameterName = "@orgId";
                p.Value = orgId.ToString();
                cmdFlags.Parameters.Add(p);

                using var reader = await cmdFlags.ExecuteReaderAsync(ct);
                while (await reader.ReadAsync(ct))
                {
                    var ruleCode = reader["RuleCode"]?.ToString();
                    var expEn = reader["ExplanationEn"]?.ToString();
                    if (!string.IsNullOrWhiteSpace(ruleCode))
                    {
                        activeFlags.Add(ruleCode);
                        if (!string.IsNullOrWhiteSpace(expEn))
                        {
                            flagSummaries.Add($"{ruleCode}: {expEn}");
                        }
                    }
                }
            }

            if (!wasOpen)
            {
                await conn.CloseAsync();
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not aggregate live DB activity records for org {OrgId}, falling back to facility profile.", orgId);
        }

        return new AggregatedFacilityData(
            AnnualElectricityKwh: annualKwh,
            TotalElectricityCostBdt: totalElecCost,
            ElectricityTariffBdtPerKwh: elecTariff,
            AnnualDieselLitres: annualDiesel,
            TotalDieselCostBdt: totalDieselCost,
            DieselTariffBdtPerLitre: dieselTariff,
            AnnualGasM3: annualGas,
            TotalGasCostBdt: totalGasCost,
            GasTariffBdtPerM3: gasTariff,
            HasRealBills: hasRealBills,
            BillsCount: totalBillsCount,
            ActiveFlagCodes: activeFlags,
            ActiveFlagSummaries: flagSummaries);
    }
}
