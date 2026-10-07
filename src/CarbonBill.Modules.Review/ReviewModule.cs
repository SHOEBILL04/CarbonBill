using CarbonBill.SharedKernel.Domain;
using CarbonBill.SharedKernel.Tenancy;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CarbonBill.Modules.Review;

public class ReviewDecision : BaseEntity, ITenantScopedEntity
{
    public Guid OrgId { get; set; }
    public Guid DocumentId { get; set; }
    public Guid ReviewerUserId { get; set; }
    public string Mode { get; set; } = "manual"; // manual, auto_confirmed, sampling_audit
    public string Decision { get; set; } = "Approved"; // Approved, Rejected, Edited
    public string? Notes { get; set; }
    public DateTime DecidedAtUtc { get; set; } = DateTime.UtcNow;
}

public static class ReviewModuleExtensions
{
    public static IServiceCollection AddReviewModule(this IServiceCollection services, IConfiguration configuration)
    {
        // Module shell DI registration
        return services;
    }
}
