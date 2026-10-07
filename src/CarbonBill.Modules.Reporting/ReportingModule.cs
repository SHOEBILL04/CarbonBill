using CarbonBill.SharedKernel.Domain;
using CarbonBill.SharedKernel.Tenancy;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CarbonBill.Modules.Reporting;

public static class ReportStatuses
{
    public const string Draft = "Draft";
    public const string ReadyForReview = "ReadyForReview";
    public const string Approved = "Approved";
    public const string Locked = "Locked";
    public const string Superseded = "Superseded";
}

public class Report : AggregateRoot, ITenantScopedEntity
{
    public Guid OrgId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ReportingPeriod { get; set; } = "2026"; // Year or Period
    public string Status { get; set; } = ReportStatuses.Draft;
    public decimal TotalKgCo2e { get; set; }
    public decimal Scope1KgCo2e { get; set; }
    public decimal Scope2KgCo2e { get; set; }
    public decimal Scope3KgCo2e { get; set; }
    public decimal DataQualityScore { get; set; } // 0 to 100
    public string MethodologyStatement { get; set; } = "Estimate aligned with GHG Protocol methodology, not audited or certified.";
    public List<ReportSnapshot> Snapshots { get; set; } = [];
    public List<ShareLink> ShareLinks { get; set; } = [];
}

public class ReportSnapshot : BaseEntity, ITenantScopedEntity
{
    public Guid OrgId { get; set; }
    public Guid ReportId { get; set; }
    public Report Report { get; set; } = null!;
    public int Version { get; set; } = 1;
    public string ContentHashSha256 { get; set; } = string.Empty;
    public string SnapshotDataJson { get; set; } = "{}";
    public Guid FrozenByUserId { get; set; }
    public DateTime FrozenAtUtc { get; set; } = DateTime.UtcNow;
}

public class ShareLink : BaseEntity, ITenantScopedEntity
{
    public Guid OrgId { get; set; }
    public Guid ReportId { get; set; }
    public Report Report { get; set; } = null!;
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public bool RedactPrices { get; set; }
    public bool IsRevoked { get; set; }
    public int ViewCount { get; set; }
}

public static class ReportingModuleExtensions
{
    public static IServiceCollection AddReportingModule(this IServiceCollection services, IConfiguration configuration)
    {
        // Module shell DI registration
        return services;
    }
}
