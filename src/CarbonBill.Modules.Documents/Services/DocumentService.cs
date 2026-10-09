using CarbonBill.Modules.Documents.Domain;
using CarbonBill.Modules.Documents.Persistence;
using CarbonBill.SharedKernel.Domain;
using CarbonBill.SharedKernel.Events;
using CarbonBill.SharedKernel.Providers;
using CarbonBill.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CarbonBill.Modules.Documents.Services;

public record DocumentUploadedEvent(
    Guid DocumentId,
    Guid OrgId,
    string StoragePath,
    string ContentType,
    string Source,
    DateTime OccurredOnUtc) : IDomainEvent;

public class DocumentService(
    DocumentsDbContext dbContext,
    IFileStore fileStore,
    ITenantContext tenantContext,
    IDomainEventPublisher eventPublisher,
    ILogger<DocumentService> logger) : IDocumentService
{
    public async Task<Result<DocumentReceiptDto>> UploadDocumentAsync(
        Stream fileStream,
        string fileName,
        string claimedContentType,
        Guid uploadedByUserId,
        string? idempotencyKey = null,
        string source = "phone",
        CancellationToken ct = default)
    {
        var orgId = tenantContext.CurrentOrgId;
        if (!orgId.HasValue)
        {
            return Result.Failure<DocumentReceiptDto>("Active Organization ID is required for document upload.");
        }

        // Check idempotency key if provided
        if (!string.IsNullOrWhiteSpace(idempotencyKey))
        {
            var existingWithIdempotency = await dbContext.Documents
                .FirstOrDefaultAsync(d => d.OrgId == orgId.Value && d.ClientIdempotencyKey == idempotencyKey, ct);

            if (existingWithIdempotency != null)
            {
                logger.LogInformation("Idempotent request matched existing document: {DocumentId}", existingWithIdempotency.Id);
                return Result.Success(new DocumentReceiptDto(
                    existingWithIdempotency.Id,
                    existingWithIdempotency.Status,
                    existingWithIdempotency.FileName,
                    existingWithIdempotency.ContentType,
                    existingWithIdempotency.FileSizeBytes,
                    existingWithIdempotency.CapturedAtUtc,
                    Received: true,
                    IsDuplicate: false));
            }
        }

        // Validate file (magic bytes, size, SHA-256)
        var validation = await DocumentFileValidator.ValidateAsync(fileStream, claimedContentType, ct);
        if (!validation.IsValid)
        {
            return Result.Failure<DocumentReceiptDto>(validation.ErrorMessage ?? "File validation failed.");
        }

        var sha256 = validation.Sha256Hash!;
        var detectedType = validation.DetectedContentType!;

        // Duplicate Detection by SHA-256 within the same organization
        var existingDuplicate = await dbContext.Documents
            .FirstOrDefaultAsync(d => d.OrgId == orgId.Value && d.Sha256Hash == sha256, ct);

        if (existingDuplicate != null)
        {
            logger.LogWarning("Duplicate file uploaded by org {OrgId}. Matching existing doc: {DocId}", orgId.Value, existingDuplicate.Id);
            return Result.Success(new DocumentReceiptDto(
                existingDuplicate.Id,
                DocumentStatuses.Duplicate,
                existingDuplicate.FileName,
                existingDuplicate.ContentType,
                existingDuplicate.FileSizeBytes,
                existingDuplicate.CapturedAtUtc,
                Received: true,
                IsDuplicate: true));
        }

        // Upload to FileStore (R2 or Local disk)
        var documentId = Guid.NewGuid();
        var safeFileName = Path.GetFileName(fileName);
        var fileExtension = Path.GetExtension(safeFileName);
        var storagePath = $"documents/org_{orgId.Value:N}/{documentId:N}{fileExtension}";

        fileStream.Seek(0, SeekOrigin.Begin);
        var uploadPath = await fileStore.UploadAsync(
            fileStream,
            storagePath,
            detectedType,
            new Dictionary<string, string>
            {
                ["org_id"] = orgId.Value.ToString(),
                ["document_id"] = documentId.ToString(),
                ["sha256"] = sha256
            },
            ct);

        // Create Document entity
        var document = new Document
        {
            Id = documentId,
            OrgId = orgId.Value,
            FileName = safeFileName,
            StoragePath = uploadPath,
            ContentType = detectedType,
            FileSizeBytes = validation.FileSizeBytes,
            Sha256Hash = sha256,
            Status = DocumentStatuses.Uploaded,
            Source = source,
            CapturedAtUtc = DateTime.UtcNow,
            UploadedByUserId = uploadedByUserId,
            ClientIdempotencyKey = idempotencyKey,
            Pages =
            [
                new DocumentPage
                {
                    Id = Guid.NewGuid(),
                    DocumentId = documentId,
                    PageNumber = 1,
                    StoragePath = uploadPath
                }
            ]
        };

        dbContext.Documents.Add(document);
        await dbContext.SaveChangesAsync(ct);

        logger.LogInformation("Document {DocumentId} successfully ingested for Org {OrgId}", document.Id, orgId.Value);

        // Publish DocumentUploaded domain event
        await eventPublisher.PublishAsync(new DocumentUploadedEvent(
            document.Id,
            document.OrgId,
            document.StoragePath,
            document.ContentType,
            document.Source,
            DateTime.UtcNow), ct);

        return Result.Success(new DocumentReceiptDto(
            document.Id,
            document.Status,
            document.FileName,
            document.ContentType,
            document.FileSizeBytes,
            document.CapturedAtUtc,
            Received: true,
            IsDuplicate: false));
    }

    public async Task<Result<DocumentReceiptDto>> CreateManualEntryAsync(
        ManualEntryRequest request,
        Guid uploadedByUserId,
        CancellationToken ct = default)
    {
        var orgId = tenantContext.CurrentOrgId;
        if (!orgId.HasValue)
        {
            return Result.Failure<DocumentReceiptDto>("Active Organization ID is required.");
        }

        var documentId = Guid.NewGuid();
        var document = new Document
        {
            Id = documentId,
            OrgId = orgId.Value,
            AssetId = request.AssetId,
            FileName = $"manual_{request.DocType}_{request.SlipNumber}.json",
            StoragePath = $"manual_entries/{documentId:N}.json",
            ContentType = "application/json",
            FileSizeBytes = 0,
            Sha256Hash = string.Empty,
            Status = DocumentStatuses.NeedsReview,
            Source = "manual",
            DocType = request.DocType,
            CapturedAtUtc = request.Date == default ? DateTime.UtcNow : request.Date.ToUniversalTime(),
            UploadedByUserId = uploadedByUserId,
            IsEstimated = false
        };

        dbContext.Documents.Add(document);
        await dbContext.SaveChangesAsync(ct);

        logger.LogInformation("Manual document entry {DocumentId} created for Org {OrgId}", document.Id, orgId.Value);

        return Result.Success(new DocumentReceiptDto(
            document.Id,
            document.Status,
            document.FileName,
            document.ContentType,
            0,
            document.CapturedAtUtc,
            Received: true));
    }

    public async Task<IReadOnlyList<DocumentReceiptDto>> GetDocumentsAsync(
        string? status = null,
        int limit = 20,
        CancellationToken ct = default)
    {
        var query = dbContext.Documents.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(d => d.Status == status);
        }

        return await query
            .OrderByDescending(d => d.CapturedAtUtc)
            .Take(Math.Min(limit, 100))
            .Select(d => new DocumentReceiptDto(
                d.Id,
                d.Status,
                d.FileName,
                d.ContentType,
                d.FileSizeBytes,
                d.CapturedAtUtc,
                true,
                d.Status == DocumentStatuses.Duplicate))
            .ToListAsync(ct);
    }

    public async Task<Result<DocumentDetailDto>> GetDocumentByIdAsync(
        Guid documentId,
        CancellationToken ct = default)
    {
        var document = await dbContext.Documents
            .Include(d => d.Pages)
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == documentId, ct);

        if (document == null)
        {
            return Result.Failure<DocumentDetailDto>("Document not found.");
        }

        string? preSignedUrl = null;
        try
        {
            if (!string.IsNullOrWhiteSpace(document.StoragePath))
            {
                preSignedUrl = await fileStore.GetPreSignedUrlAsync(document.StoragePath, TimeSpan.FromMinutes(30), ct);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not generate pre-signed URL for document {DocumentId}", document.Id);
        }

        return Result.Success(new DocumentDetailDto(
            document.Id,
            document.OrgId,
            document.SiteId,
            document.AssetId,
            document.FileName,
            document.StoragePath,
            document.ContentType,
            document.FileSizeBytes,
            document.Sha256Hash,
            document.Status,
            document.Source,
            document.CapturedAtUtc,
            document.TierUsed,
            document.IsEstimated,
            document.DocType,
            preSignedUrl,
            document.Pages.Select(p => new DocumentPageDto(p.Id, p.PageNumber, p.StoragePath)).ToList()));
    }

    public async Task<IReadOnlyList<DocumentReceiptDto>> GetMySubmissionsAsync(
        Guid userId,
        int limit = 20,
        CancellationToken ct = default)
    {
        return await dbContext.Documents
            .AsNoTracking()
            .Where(d => d.UploadedByUserId == userId)
            .OrderByDescending(d => d.CapturedAtUtc)
            .Take(Math.Min(limit, 50))
            .Select(d => new DocumentReceiptDto(
                d.Id,
                d.Status,
                d.FileName,
                d.ContentType,
                d.FileSizeBytes,
                d.CapturedAtUtc,
                true,
                d.Status == DocumentStatuses.Duplicate))
            .ToListAsync(ct);
    }
}
