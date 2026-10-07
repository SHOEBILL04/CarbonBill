using CarbonBill.SharedKernel.Domain;
using CarbonBill.SharedKernel.Tenancy;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CarbonBill.Modules.FactorRegistry;

public class FactorSet : BaseEntity
{
    public string Name { get; set; } = string.Empty; // e.g. "DEFRA 2026", "IGES Bangladesh Grid 2025"
    public string GwpBasis { get; set; } = "AR6"; // AR5, AR6
    public string SourceCitation { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Region { get; set; } = "BD";
    public int Version { get; set; } = 1;
    public DateTime ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public bool IsPublished { get; set; }
    public List<EmissionFactor> Factors { get; set; } = [];
}

public class EmissionFactor : BaseEntity
{
    public Guid FactorSetId { get; set; }
    public FactorSet FactorSet { get; set; } = null!;
    public string ActivityType { get; set; } = string.Empty; // Electricity, Diesel, NaturalGas, Freight
    public string FuelOrMode { get; set; } = string.Empty;
    public string Unit { get; set; } = "kWh";
    public decimal Co2eFactor { get; set; } // kg CO2e per unit
    public int Scope { get; set; } = 1; // 1, 2, 3
    public string? Tier { get; set; } = "Tier 1";
    public string? Notes { get; set; }
}

public class FactorOverride : BaseEntity, ITenantScopedEntity
{
    public Guid OrgId { get; set; }
    public Guid EmissionFactorId { get; set; }
    public decimal OverrideValue { get; set; }
    public string Justification { get; set; } = string.Empty; // Mandatory as per PDF
    public Guid ApprovedByUserId { get; set; }
    public DateTime ApprovedAtUtc { get; set; } = DateTime.UtcNow;
}

public interface IFactorSetLoader
{
    Task<int> LoadFactorsFromJsonAsync(Stream jsonStream, CancellationToken cancellationToken = default);
}

public static class FactorRegistryModuleExtensions
{
    public static IServiceCollection AddFactorRegistryModule(this IServiceCollection services, IConfiguration configuration)
    {
        // Module shell DI registration
        return services;
    }
}
