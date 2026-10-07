using CarbonBill.SharedKernel.Domain;
using CarbonBill.SharedKernel.Tenancy;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CarbonBill.Modules.Recommendations;

public static class RecommendationStatuses
{
    public const string Suggested = "Suggested";
    public const string Planned = "Planned";
    public const string Done = "Done";
    public const string NotFeasible = "NotFeasible";
}

public class Measure : BaseEntity
{
    public string MeasureCode { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string NameBn { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // Lighting, Motors, Steam/Boilers, SolarPV, etc.
    public string ApplicableSectorsJson { get; set; } = "[\"RMG\",\"Textile\"]";
    public string ApplicabilityRulesJson { get; set; } = "{}";
    
    // Percentage savings range
    public decimal SavingPercentLow { get; set; }
    public decimal SavingPercentTypical { get; set; }
    public decimal SavingPercentHigh { get; set; }

    // Capex
    public decimal CapexLowBdt { get; set; }
    public decimal CapexHighBdt { get; set; }
    public string CapexUnit { get; set; } = "per kW";

    public decimal OpexChangeBdtPerYear { get; set; }
    public int LifetimeYears { get; set; }
    public int ImplementationWeeks { get; set; }

    public string EvidenceGrade { get; set; } = "B"; // A = measured BD factories, B = regional/case studies, C = engineering estimate
    public string LocalNotes { get; set; } = string.Empty;
    public List<MeasureSource> Sources { get; set; } = [];
}

public class MeasureSource : BaseEntity
{
    public Guid MeasureId { get; set; }
    public Measure Measure { get; set; } = null!;
    public string Citation { get; set; } = string.Empty; // e.g. "IFC PaCT 2024, Page 42"
    public int Year { get; set; }
    public string? PageOrTable { get; set; }
    public string? Url { get; set; }
}

public class Recommendation : AggregateRoot, ITenantScopedEntity
{
    public Guid OrgId { get; set; }
    public Guid MeasureId { get; set; }
    public Measure Measure { get; set; } = null!;
    
    public decimal AnnualTco2eAvoidedLow { get; set; }
    public decimal AnnualTco2eAvoidedTypical { get; set; }
    public decimal AnnualTco2eAvoidedHigh { get; set; }

    public decimal AnnualSavingsBdtLow { get; set; }
    public decimal AnnualSavingsBdtTypical { get; set; }
    public decimal AnnualSavingsBdtHigh { get; set; }

    public decimal PaybackYearsLow { get; set; }
    public decimal PaybackYearsHigh { get; set; }

    public string Status { get; set; } = RecommendationStatuses.Suggested;
    public decimal? RealisedAnnualSavingBdt { get; set; }
    public decimal? RealisedAnnualTco2eAvoided { get; set; }
}

public interface IMeasureLibraryLoader
{
    Task<int> LoadMeasuresFromJsonAsync(Stream jsonStream, CancellationToken cancellationToken = default);
}

public static class RecommendationsModuleExtensions
{
    public static IServiceCollection AddRecommendationsModule(this IServiceCollection services, IConfiguration configuration)
    {
        // Module shell DI registration
        return services;
    }
}
