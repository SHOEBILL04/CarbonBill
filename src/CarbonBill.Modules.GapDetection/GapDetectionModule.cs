using CarbonBill.SharedKernel.Domain;
using CarbonBill.SharedKernel.Tenancy;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CarbonBill.Modules.GapDetection;

public class MissingAlert : AggregateRoot, ITenantScopedEntity
{
    public Guid OrgId { get; set; }
    public Guid SiteId { get; set; }
    public Guid AssetId { get; set; }
    public string DocType { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public Guid? ResponsibleUserId { get; set; }
    public string Status { get; set; } = "Open"; // Open, Reminded, Resolved, Escalated
    public int EscalationLevel { get; set; } // 0 = normal, 1 = reminder, 2 = manager escalation
    public DateTime? ResolvedAtUtc { get; set; }
}

public interface IGapDetector
{
    Task CheckMissingDocumentsAsync(Guid orgId, string period, CancellationToken cancellationToken = default);
}

public static class GapDetectionModuleExtensions
{
    public static IServiceCollection AddGapDetectionModule(this IServiceCollection services, IConfiguration configuration)
    {
        // Module shell DI registration
        return services;
    }
}
