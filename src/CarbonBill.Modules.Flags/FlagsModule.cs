using CarbonBill.SharedKernel.Domain;
using CarbonBill.SharedKernel.Tenancy;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CarbonBill.Modules.Flags;

public static class FlagSeverities
{
    public const string Info = "Info";
    public const string Amber = "Amber";
    public const string Red = "Red";
}

public static class FlagStates
{
    public const string Open = "Open";
    public const string Acknowledged = "Acknowledged";
    public const string Resolved = "Resolved";
    public const string Dismissed = "Dismissed";
}

public class FlagRule : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Family { get; set; } = "DataQuality"; // DataQuality, Footprint, BuyerReadiness, BillSavings
    public string NameEn { get; set; } = string.Empty;
    public string NameBn { get; set; } = string.Empty;
    public string Severity { get; set; } = FlagSeverities.Amber;
    public string DefaultThresholdJson { get; set; } = "{}";
    public bool IsActive { get; set; } = true;
}

public class Flag : AggregateRoot, ITenantScopedEntity
{
    public Guid OrgId { get; set; }
    public Guid? SiteId { get; set; }
    public Guid RuleId { get; set; }
    public FlagRule Rule { get; set; } = null!;
    public string Severity { get; set; } = FlagSeverities.Amber;
    public string Period { get; set; } = string.Empty;
    public string EvidenceJson { get; set; } = "{}"; // Document and record IDs
    public string ExplanationEn { get; set; } = string.Empty;
    public string ExplanationBn { get; set; } = string.Empty;
    public string SuggestedActionEn { get; set; } = string.Empty;
    public string SuggestedActionBn { get; set; } = string.Empty;
    public string State { get; set; } = FlagStates.Open;
    public string? DismissReason { get; set; }
    public DateTime? DismissExpiresAtUtc { get; set; } // Expires after 30 days as per PDF
}

public static class FlagsModuleExtensions
{
    public static IServiceCollection AddFlagsModule(this IServiceCollection services, IConfiguration configuration)
    {
        // Module shell DI registration
        return services;
    }
}
