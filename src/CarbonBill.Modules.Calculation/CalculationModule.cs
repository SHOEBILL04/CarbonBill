using CarbonBill.SharedKernel.Domain;
using CarbonBill.SharedKernel.Tenancy;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CarbonBill.Modules.Calculation;

public class EmissionResult : AggregateRoot, ITenantScopedEntity
{
    public Guid OrgId { get; set; }
    public Guid ActivityRecordId { get; set; }
    public Guid FactorId { get; set; }
    public int FactorVersion { get; set; }
    public int ConversionVersion { get; set; }
    public int Scope { get; set; } // 1, 2, 3
    public string Category { get; set; } = string.Empty; // e.g. "Stationary Combustion", "Grid Electricity"
    public decimal QuantityStandard { get; set; }
    public string StandardUnit { get; set; } = string.Empty;
    public decimal EmissionFactorUsed { get; set; }
    public decimal KgCo2e { get; set; } // Formula: quantity_standard * emission_factor
    public decimal TonnesCo2e => KgCo2e / 1000m;
    public string Period { get; set; } = "2026-09";
    public bool IsEstimated { get; set; }
    public DateTime CalculatedAtUtc { get; set; } = DateTime.UtcNow;
}

public interface ICalculationEngine
{
    decimal CalculateKgCo2e(decimal standardQuantity, decimal emissionFactor);
}

public class CalculationEngine : ICalculationEngine
{
    public decimal CalculateKgCo2e(decimal standardQuantity, decimal emissionFactor)
    {
        // Enforce strict decimal precision, no float/double rounding during calculation
        return standardQuantity * emissionFactor;
    }
}

public static class CalculationModuleExtensions
{
    public static IServiceCollection AddCalculationModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<ICalculationEngine, CalculationEngine>();
        return services;
    }
}
