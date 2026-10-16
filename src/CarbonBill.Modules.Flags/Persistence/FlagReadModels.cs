using System.Globalization;
using CarbonBill.Modules.Flags.Contracts;
using CarbonBill.SharedKernel.Contracts;
using Microsoft.EntityFrameworkCore;

namespace CarbonBill.Modules.Flags.Persistence;

public class DbDocumentReadModel(FlagsDbContext dbContext) : IDocumentReadModel
{
    public async Task<IReadOnlyList<DocumentSummaryDto>> GetDocumentsAsync(Guid orgId, string? billingPeriod = null, CancellationToken ct = default)
    {
        var conn = dbContext.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open)
        {
            await conn.OpenAsync(ct);
        }

        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT 
                d.Id, d.OrgId, d.SiteId, d.AssetId, d.DocType, d.CapturedAtUtc, d.Status,
                ef.BillingPeriod
            FROM Documents d
            LEFT JOIN (
                SELECT DocumentId, MAX(COALESCE(CorrectedValue, NormalizedValue, RawValue)) as BillingPeriod
                FROM ExtractedFields
                WHERE FieldName = 'BillingPeriod'
                GROUP BY DocumentId
            ) ef ON d.Id = ef.DocumentId
            WHERE d.OrgId = @orgId COLLATE NOCASE AND d.Status NOT IN ('Duplicate', 'Failed')
            ORDER BY d.CapturedAtUtc DESC;
        ";
        var p = cmd.CreateParameter();
        p.ParameterName = "@orgId";
        p.Value = orgId.ToString();
        cmd.Parameters.Add(p);

        var list = new List<DocumentSummaryDto>();
        using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            var id = Guid.Parse(reader["Id"].ToString()!);
            var oId = Guid.Parse(reader["OrgId"].ToString()!);
            Guid? siteId = reader["SiteId"] != DBNull.Value ? Guid.Parse(reader["SiteId"].ToString()!) : null;
            Guid? assetId = reader["AssetId"] != DBNull.Value ? Guid.Parse(reader["AssetId"].ToString()!) : null;
            var docType = reader["DocType"] != DBNull.Value ? reader["DocType"].ToString() : null;
            var capturedAt = Convert.ToDateTime(reader["CapturedAtUtc"], CultureInfo.InvariantCulture);
            var status = reader["Status"]?.ToString() ?? "Uploaded";
            var period = reader["BillingPeriod"] != DBNull.Value && !string.IsNullOrWhiteSpace(reader["BillingPeriod"]?.ToString())
                ? reader["BillingPeriod"].ToString()
                : capturedAt.ToString("yyyy-MM", CultureInfo.InvariantCulture);

            if (!string.IsNullOrWhiteSpace(billingPeriod) && !string.Equals(period, billingPeriod, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            list.Add(new DocumentSummaryDto(id, oId, siteId, assetId, docType, period, capturedAt, status));
        }

        return list;
    }

    public async Task<bool> HasDocumentAsync(Guid orgId, Guid? assetId, string? docType, string billingPeriod, CancellationToken ct = default)
    {
        var conn = dbContext.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open)
        {
            await conn.OpenAsync(ct);
        }

        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT 
                d.Id, d.AssetId, d.DocType, d.FileName, d.CapturedAtUtc,
                ef.BillingPeriod
            FROM Documents d
            LEFT JOIN (
                SELECT DocumentId, MAX(COALESCE(CorrectedValue, NormalizedValue, RawValue)) as BillingPeriod
                FROM ExtractedFields
                WHERE FieldName = 'BillingPeriod'
                GROUP BY DocumentId
            ) ef ON d.Id = ef.DocumentId
            WHERE d.OrgId = @orgId COLLATE NOCASE AND d.Status NOT IN ('Duplicate', 'Failed');
        ";
        var p = cmd.CreateParameter();
        p.ParameterName = "@orgId";
        p.Value = orgId.ToString();
        cmd.Parameters.Add(p);

        using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            var docAssetId = reader["AssetId"] != DBNull.Value ? Guid.Parse(reader["AssetId"].ToString()!) : (Guid?)null;
            var docDocType = reader["DocType"]?.ToString() ?? "";
            var fileName = reader["FileName"]?.ToString() ?? "";
            var capturedAt = Convert.ToDateTime(reader["CapturedAtUtc"], CultureInfo.InvariantCulture);
            var period = reader["BillingPeriod"] != DBNull.Value && !string.IsNullOrWhiteSpace(reader["BillingPeriod"]?.ToString())
                ? reader["BillingPeriod"].ToString()
                : capturedAt.ToString("yyyy-MM", CultureInfo.InvariantCulture);

            if (assetId.HasValue && docAssetId.HasValue && assetId.Value != docAssetId.Value)
            {
                continue;
            }

            if (!string.IsNullOrWhiteSpace(docType))
            {
                var dt = docType.ToLowerInvariant();
                var combined = $"{docDocType} {fileName}".ToLowerInvariant();

                bool typeMatch = false;
                if (dt.Contains("electr") || dt.Contains("meter"))
                {
                    typeMatch = combined.Contains("electr") || combined.Contains("meter") || combined.Contains("desco") || combined.Contains("bpdb") || combined.Contains("dpdc") || combined.Contains("power");
                }
                else if (dt.Contains("diesel") || dt.Contains("fuel") || dt.Contains("genset"))
                {
                    typeMatch = combined.Contains("diesel") || combined.Contains("fuel") || combined.Contains("genset") || combined.Contains("padma") || combined.Contains("slip");
                }
                else if (dt.Contains("gas") || dt.Contains("boiler"))
                {
                    typeMatch = combined.Contains("gas") || combined.Contains("titas") || combined.Contains("boiler");
                }
                else
                {
                    typeMatch = combined.Contains(dt);
                }

                if (!typeMatch) continue;
            }

            // Period match: matches period or matches current month/uploaded month
            if (string.Equals(period, billingPeriod, StringComparison.OrdinalIgnoreCase) ||
                capturedAt.ToString("yyyy-MM", CultureInfo.InvariantCulture).Equals(billingPeriod, StringComparison.OrdinalIgnoreCase) ||
                DateTime.UtcNow.ToString("yyyy-MM", CultureInfo.InvariantCulture).Equals(billingPeriod, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}

public class DbFlagDocumentReadModel(FlagsDbContext dbContext) : IFlagDocumentReadModel
{
    public async Task<IReadOnlyList<ExtractedDocumentRecord>> GetExtractedDocumentsAsync(Guid orgId, string period, CancellationToken ct = default)
    {
        var conn = dbContext.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open)
        {
            await conn.OpenAsync(ct);
        }

        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT 
                d.Id AS DocumentId,
                d.OrgId,
                d.SiteId,
                d.AssetId,
                d.FileName,
                d.DocType,
                d.Sha256Hash,
                d.Status,
                d.CapturedAtUtc,
                run.OverallConfidence,
                ef.FieldName,
                COALESCE(ef.CorrectedValue, ef.NormalizedValue, ef.RawValue) AS FieldValue,
                ef.Confidence AS FieldConfidence
            FROM Documents d
            LEFT JOIN (
                SELECT DocumentId, MAX(OverallConfidence) as OverallConfidence
                FROM ExtractionRuns
                GROUP BY DocumentId
            ) run ON d.Id = run.DocumentId
            LEFT JOIN ExtractedFields ef ON d.Id = ef.DocumentId
            WHERE d.OrgId = @orgId COLLATE NOCASE AND d.Status NOT IN ('Duplicate', 'Failed')
            ORDER BY d.CapturedAtUtc DESC;
        ";
        var p = cmd.CreateParameter();
        p.ParameterName = "@orgId";
        p.Value = orgId.ToString();
        cmd.Parameters.Add(p);

        var docMap = new Dictionary<Guid, (Guid DocId, Guid OrgId, Guid? SiteId, Guid? AssetId, string DocType, string? FileHash, string Status, DateTime CapturedAt, float OverallConf, List<ExtractedFieldConfidence> Fields)>();

        using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            var docId = Guid.Parse(reader["DocumentId"].ToString()!);
            if (!docMap.TryGetValue(docId, out var entry))
            {
                var oId = Guid.Parse(reader["OrgId"].ToString()!);
                Guid? sId = reader["SiteId"] != DBNull.Value ? Guid.Parse(reader["SiteId"].ToString()!) : null;
                Guid? aId = reader["AssetId"] != DBNull.Value ? Guid.Parse(reader["AssetId"].ToString()!) : null;
                var dt = reader["DocType"]?.ToString() ?? "UtilityBill";
                var hash = reader["Sha256Hash"] != DBNull.Value ? reader["Sha256Hash"]?.ToString() : null;
                var status = reader["Status"]?.ToString() ?? "Uploaded";
                var capturedAt = Convert.ToDateTime(reader["CapturedAtUtc"], CultureInfo.InvariantCulture);
                float oConf = reader["OverallConfidence"] != DBNull.Value ? Convert.ToSingle(reader["OverallConfidence"], CultureInfo.InvariantCulture) : 0.95f;

                entry = (docId, oId, sId, aId, dt, hash, status, capturedAt, oConf, new List<ExtractedFieldConfidence>());
                docMap[docId] = entry;
            }

            if (reader["FieldName"] != DBNull.Value)
            {
                var fName = reader["FieldName"].ToString()!;
                var fVal = reader["FieldValue"]?.ToString() ?? "";
                float fConf = reader["FieldConfidence"] != DBNull.Value ? Convert.ToSingle(reader["FieldConfidence"], CultureInfo.InvariantCulture) : 0.95f;
                entry.Fields.Add(new ExtractedFieldConfidence(fName, fVal, fConf));
            }
        }

        var results = new List<ExtractedDocumentRecord>();
        foreach (var kv in docMap.Values)
        {
            bool isConfirmed = kv.Status.Equals("Confirmed", StringComparison.OrdinalIgnoreCase) ||
                               kv.Status.Equals("Calculated", StringComparison.OrdinalIgnoreCase);

            float minConf = isConfirmed ? 1.0f : (kv.Fields.Count > 0 ? kv.Fields.Min(f => f.Confidence) : kv.OverallConf);

            string? vendor = kv.Fields.FirstOrDefault(f => f.FieldName.Equals("Vendor", StringComparison.OrdinalIgnoreCase))?.Value;
            string? billNum = kv.Fields.FirstOrDefault(f => f.FieldName.Equals("BillNumber", StringComparison.OrdinalIgnoreCase))?.Value;
            string? unit = kv.Fields.FirstOrDefault(f => f.FieldName.Equals("Unit", StringComparison.OrdinalIgnoreCase))?.Value ?? "unit";
            string? billingPeriod = kv.Fields.FirstOrDefault(f => f.FieldName.Equals("BillingPeriod", StringComparison.OrdinalIgnoreCase))?.Value;

            if (string.IsNullOrWhiteSpace(billingPeriod))
            {
                billingPeriod = kv.CapturedAt.ToString("yyyy-MM", CultureInfo.InvariantCulture);
            }

            decimal quantity = 0m;
            var qStr = kv.Fields.FirstOrDefault(f => f.FieldName.Equals("Quantity", StringComparison.OrdinalIgnoreCase))?.Value;
            if (!string.IsNullOrWhiteSpace(qStr) && decimal.TryParse(qStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var qVal))
            {
                quantity = qVal;
            }

            results.Add(new ExtractedDocumentRecord(
                DocumentId: kv.DocId,
                OrgId: kv.OrgId,
                SiteId: kv.SiteId,
                AssetId: kv.AssetId,
                AssetName: kv.AssetId.HasValue ? "Asset " + kv.AssetId.Value.ToString()[..4] : null,
                DocType: kv.DocType,
                BillingPeriod: billingPeriod,
                FileHash: kv.FileHash,
                VendorName: vendor,
                BillNumber: billNum,
                Quantity: quantity,
                Unit: unit,
                MinFieldConfidence: minConf,
                Fields: kv.Fields));
        }

        return results;
    }

    public async Task<HistoricalAssetConsumption?> GetHistoricalConsumptionAsync(Guid orgId, Guid assetId, CancellationToken ct = default)
    {
        var conn = dbContext.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open)
        {
            await conn.OpenAsync(ct);
        }

        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT StandardUnit, QuantityStandard
            FROM EmissionResults
            WHERE OrgId = @orgId COLLATE NOCASE
            ORDER BY CalculatedAtUtc DESC
            LIMIT 12;
        ";
        var p = cmd.CreateParameter();
        p.ParameterName = "@orgId";
        p.Value = orgId.ToString();
        cmd.Parameters.Add(p);

        var pastQuantities = new List<decimal>();
        string unit = "kWh";

        using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            if (reader["StandardUnit"] != DBNull.Value) unit = reader["StandardUnit"].ToString()!;
            if (reader["QuantityStandard"] != DBNull.Value && decimal.TryParse(reader["QuantityStandard"]?.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var q))
            {
                pastQuantities.Add(q);
            }
        }

        return new HistoricalAssetConsumption(assetId, "Meter/Asset", unit, pastQuantities);
    }
}

public class DbFlagEmissionReadModel(FlagsDbContext dbContext) : IFlagEmissionReadModel
{
    public async Task<PeriodEmissionSummary?> GetPeriodEmissionSummaryAsync(Guid orgId, string period, CancellationToken ct = default)
    {
        var conn = dbContext.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open)
        {
            await conn.OpenAsync(ct);
        }

        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT 
                SUM(KgCo2e) AS TotalKgCo2e,
                SUM(CASE WHEN IsEstimated = 1 THEN KgCo2e ELSE 0 END) AS EstimatedKgCo2e
            FROM EmissionResults
            WHERE OrgId = @orgId COLLATE NOCASE AND (Period = @period OR @period = 'all');
        ";
        var p1 = cmd.CreateParameter();
        p1.ParameterName = "@orgId";
        p1.Value = orgId.ToString();
        cmd.Parameters.Add(p1);

        var p2 = cmd.CreateParameter();
        p2.ParameterName = "@period";
        p2.Value = period;
        cmd.Parameters.Add(p2);

        using var reader = await cmd.ExecuteReaderAsync(ct);
        if (await reader.ReadAsync(ct))
        {
            decimal totalKg = reader["TotalKgCo2e"] != DBNull.Value ? Convert.ToDecimal(reader["TotalKgCo2e"], CultureInfo.InvariantCulture) : 0m;
            decimal estKg = reader["EstimatedKgCo2e"] != DBNull.Value ? Convert.ToDecimal(reader["EstimatedKgCo2e"], CultureInfo.InvariantCulture) : 0m;

            return new PeriodEmissionSummary(orgId, null, period, totalKg, estKg);
        }

        return new PeriodEmissionSummary(orgId, null, period, 0m, 0m);
    }
}
