using CarbonBill.SharedKernel.Domain;
using CarbonBill.SharedKernel.Tenancy;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CarbonBill.Modules.Documents;

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
    public List<DocumentPage> Pages { get; set; } = [];
}

public class DocumentPage : BaseEntity
{
    public Guid DocumentId { get; set; }
    public Document Document { get; set; } = null!;
    public int PageNumber { get; set; }
    public string StoragePath { get; set; } = string.Empty;
}

public static class DocumentsModuleExtensions
{
    public static IServiceCollection AddDocumentsModule(this IServiceCollection services, IConfiguration configuration)
    {
        // Module shell DI registration
        return services;
    }
}
