using CarbonBill.SharedKernel.Domain;
using CarbonBill.SharedKernel.Tenancy;

namespace CarbonBill.Modules.Review.Domain;

public static class ReviewModes
{
    public const string Manual = "manual";
    public const string AutoConfirmed = "auto_confirmed";
    public const string SamplingAudit = "sampling_audit";
}

public static class ReviewDecisions
{
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
    public const string Edited = "Edited";
}

public class ReviewDecision : BaseEntity, ITenantScopedEntity
{
    public Guid OrgId { get; set; }
    public Guid DocumentId { get; set; }
    public Guid ReviewerUserId { get; set; }
    public string Mode { get; set; } = ReviewModes.Manual;
    public string Decision { get; set; } = ReviewDecisions.Approved;
    public string? Notes { get; set; }
    public DateTime DecidedAtUtc { get; set; } = DateTime.UtcNow;
}

public class ReviewOrganizationSetting : BaseEntity, ITenantScopedEntity
{
    public Guid OrgId { get; set; }
    public bool AutoConfirmEnabled { get; set; }
    public float AutoConfirmThreshold { get; set; } = 0.95f;
    public int ManualConfirmCount { get; set; }
    public float SamplingRate { get; set; } = 0.10f; // 10% human audit
}
