using CarbonBill.SharedKernel.Domain;
using CarbonBill.SharedKernel.Tenancy;

namespace CarbonBill.Modules.Documents.Domain;

public static class DocumentStatuses
{
    public const string Uploaded = "Uploaded";
    public const string Queued = "Queued";
    public const string Extracting = "Extracting";
    public const string NeedsReview = "NeedsReview";
    public const string Confirmed = "Confirmed";
    public const string Calculated = "Calculated";
    public const string InReport = "InReport";
    public const string Locked = "Locked";
    public const string Failed = "Failed";
    public const string ReuploadRequested = "ReuploadRequested";
    public const string Duplicate = "Duplicate";

    private static readonly HashSet<string> ValidStatuses =
    [
        Uploaded, Queued, Extracting, NeedsReview, Confirmed,
        Calculated, InReport, Locked, Failed, ReuploadRequested, Duplicate
    ];

    public static bool IsValid(string status) => ValidStatuses.Contains(status);
}

public class Document : AggregateRoot, ITenantScopedEntity
{
    public Guid OrgId { get; set; }
    public Guid? SiteId { get; set; }
    public Guid? AssetId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string Sha256Hash { get; set; } = string.Empty;
    public string Status { get; set; } = DocumentStatuses.Uploaded;
    public string Source { get; set; } = "phone"; // phone, web, manual
    public DateTime CapturedAtUtc { get; set; } = DateTime.UtcNow;
    public int? TierUsed { get; set; }
    public bool IsEstimated { get; set; }
    public Guid UploadedByUserId { get; set; }
    public string? ClientIdempotencyKey { get; set; }
    public string? DocType { get; set; }
    public string? FailureReason { get; set; }
    public List<DocumentPage> Pages { get; set; } = [];

    // State Machine Guards
    public Result TransitionTo(string targetStatus)
    {
        if (!DocumentStatuses.IsValid(targetStatus))
        {
            return Result.Failure($"Invalid document status: '{targetStatus}'.");
        }

        if (Status == DocumentStatuses.Locked && targetStatus != DocumentStatuses.Locked)
        {
            return Result.Failure("Locked documents are immutable and cannot transition to another status.");
        }

        Status = targetStatus;
        return Result.Success();
    }

    public void MarkNeedsReview(int tierUsed, string? docType = null)
    {
        Status = DocumentStatuses.NeedsReview;
        TierUsed = tierUsed;
        if (!string.IsNullOrWhiteSpace(docType))
        {
            DocType = docType;
        }
    }

    public void MarkFailed(string reason)
    {
        Status = DocumentStatuses.Failed;
        FailureReason = reason;
    }

    public void MarkDuplicate()
    {
        Status = DocumentStatuses.Duplicate;
    }
}

public class DocumentPage : BaseEntity
{
    public Guid DocumentId { get; set; }
    public Document Document { get; set; } = null!;
    public int PageNumber { get; set; } = 1;
    public string StoragePath { get; set; } = string.Empty;
}

public record ManualEntryRequest(
    Guid? AssetId,
    string DocType,
    string SlipNumber,
    decimal Quantity,
    string Unit,
    decimal AmountBdt,
    DateTime Date);
