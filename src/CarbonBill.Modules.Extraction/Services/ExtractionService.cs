using System.Text.Json;
using CarbonBill.Modules.Extraction.Persistence;
using CarbonBill.Modules.Extraction.Services.Classification;
using CarbonBill.Modules.Extraction.Services.Groq;
using CarbonBill.Modules.Extraction.Services.Providers;
using CarbonBill.SharedKernel.Domain;
using CarbonBill.SharedKernel.Events;
using CarbonBill.SharedKernel.Providers;
using CarbonBill.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CarbonBill.Modules.Extraction.Services;

public interface IExtractionService
{
    Task<Result<ExtractionRun>> ProcessExtractionAsync(
        Guid documentId,
        Stream documentStream,
        string fileName,
        string contentType,
        bool hasTier3Consent = true,
        CancellationToken ct = default);

    Task<ExtractionRun?> GetExtractionRunForDocumentAsync(
        Guid documentId,
        CancellationToken ct = default);
}

public class ExtractionService(
    ExtractionDbContext dbContext,
    IDualOcrEngine dualOcrEngine,
    IGroqLlmExtractor groqExtractor,
    ITenantContext tenantContext,
    IDomainEventPublisher eventPublisher,
    ILogger<ExtractionService> logger) : IExtractionService
{
    public async Task<Result<ExtractionRun>> ProcessExtractionAsync(
        Guid documentId,
        Stream documentStream,
        string fileName,
        string contentType,
        bool hasTier3Consent = true,
        CancellationToken ct = default)
    {
        var orgId = tenantContext.CurrentOrgId;
        if (!orgId.HasValue)
        {
            try
            {
                var conn = dbContext.Database.GetDbConnection();
                if (conn.State != System.Data.ConnectionState.Open) await conn.OpenAsync(ct);
                using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT OrgId FROM Documents WHERE Id = '" + documentId + "' LIMIT 1;";
                var docOrg = await cmd.ExecuteScalarAsync(ct);
                if (docOrg != null && Guid.TryParse(docOrg.ToString(), out var parsedDocOrg))
                {
                    orgId = parsedDocOrg;
                }
                else
                {
                    cmd.CommandText = "SELECT Id FROM Organizations WHERE IsActive = 1 LIMIT 1;";
                    var scalar = await cmd.ExecuteScalarAsync(ct);
                    if (scalar != null && Guid.TryParse(scalar.ToString(), out var parsed))
                    {
                        orgId = parsed;
                    }
                }
            }
            catch { }

            orgId ??= await dbContext.ExtractionRuns.Select(r => (Guid?)r.OrgId).FirstOrDefaultAsync(ct);
            if (orgId.HasValue)
            {
                tenantContext.SetContext(orgId.Value, Guid.Empty);
            }
            else
            {
                return Result.Failure<ExtractionRun>("Active Organization ID could not be determined for document.");
            }
        }

        logger.LogInformation("Processing extraction pipeline for Document {DocumentId}...", documentId);

        using var ms = new MemoryStream();
        if (documentStream.CanSeek && documentStream.Position > 0)
        {
            documentStream.Position = 0;
        }
        await documentStream.CopyToAsync(ms, ct);
        var documentBytes = ms.ToArray();
        ms.Position = 0;

        OcrExtractionResult groqResult;
        string rawOcrText = "";

        var isImage = contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) ||
                      fileName.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) ||
                      fileName.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase) ||
                      fileName.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ||
                      fileName.EndsWith(".webp", StringComparison.OrdinalIgnoreCase);

        // Fast-path for images: Try Groq Vision first (runs in ~1s on Groq LPUs vs 30-60s on Render's 0.1 CPU Tesseract)
        if (isImage && hasTier3Consent)
        {
            groqResult = await groqExtractor.ExtractAsync("", fileName, contentType, hasTier3Consent, documentBytes, ct);
            if (groqResult.Fields.Any(f => f.FieldName != "ExtractedText" && (!string.IsNullOrWhiteSpace(f.NormalizedValue) || !string.IsNullOrWhiteSpace(f.RawValue))))
            {
                logger.LogInformation("Fast-path Groq Vision succeeded for {FileName} in ~1s. Bypassing slow local CPU Tesseract.", fileName);
                rawOcrText = groqResult.Fields.FirstOrDefault(f => f.FieldName == "ExtractedText")?.RawValue ?? "";
            }
            else
            {
                // Fallback to local OCR if Vision did not produce fields
                rawOcrText = await dualOcrEngine.ExtractRawTextAsync(ms, fileName, contentType, ct);
                groqResult = await groqExtractor.ExtractAsync(rawOcrText, fileName, contentType, hasTier3Consent, documentBytes, ct);
            }
        }
        else
        {
            rawOcrText = await dualOcrEngine.ExtractRawTextAsync(ms, fileName, contentType, ct);
            groqResult = await groqExtractor.ExtractAsync(rawOcrText, fileName, contentType, hasTier3Consent, documentBytes, ct);
        }

        // 2. Classify Document Type
        var classification = DocumentClassifier.Classify(rawOcrText, fileName);

        // 4. Save ExtractionRun and ExtractedFields
        var extractionRunId = Guid.NewGuid();

        // Calculate actual overall confidence from AI extraction result or core fields
        var coreFields = groqResult.Fields.Where(f => f.FieldName != "ExtractedText").ToList();
        var overallConfidence = groqResult.OverallConfidence.HasValue && groqResult.OverallConfidence.Value > 0
            ? (float)Math.Round(Math.Clamp(groqResult.OverallConfidence.Value, 0.05f, 1.0f), 2)
            : (coreFields.Count > 0 ? (float)Math.Round(coreFields.Average(f => f.Confidence), 2) : 0.75f);

        var extractionRun = new ExtractionRun
        {
            Id = extractionRunId,
            OrgId = orgId.Value,
            DocumentId = documentId,
            TierUsed = groqResult.TierUsed,
            Status = "Completed",
            OverallConfidence = overallConfidence,
            ProcessedAtUtc = DateTime.UtcNow,
            RawOutputJson = JsonSerializer.Serialize(new
            {
                classification = classification.DocumentType,
                rawOcrText
            })
        };

        foreach (var field in groqResult.Fields)
        {
            extractionRun.Fields.Add(new ExtractedField
            {
                Id = Guid.NewGuid(),
                OrgId = orgId.Value,
                ExtractionRunId = extractionRunId,
                DocumentId = documentId,
                FieldName = field.FieldName,
                RawValue = field.RawValue,
                NormalizedValue = field.NormalizedValue,
                Confidence = field.Confidence,
                SourceTier = field.SourceTier,
                BoundingBoxJson = field.BoundingBox != null ? JsonSerializer.Serialize(field.BoundingBox) : null
            });
        }

        dbContext.ExtractionRuns.Add(extractionRun);
        await dbContext.SaveChangesAsync(ct);

        logger.LogInformation("Extraction completed for Document {DocumentId}. Extracted {Count} fields.", documentId, extractionRun.Fields.Count);

        var finalDocType = (groqResult.DetectedDocumentType != null && groqResult.DetectedDocumentType != "GeneralDocument")
            ? groqResult.DetectedDocumentType
            : (classification.DocumentType != DocumentTypes.Unknown ? classification.DocumentType : (groqResult.DetectedDocumentType ?? "GeneralDocument"));

        // Publish DocumentExtracted domain event
        await eventPublisher.PublishAsync(new DocumentExtractedEvent(
            documentId,
            orgId.Value,
            groqResult.TierUsed,
            finalDocType,
            extractionRun.Fields.Count,
            DateTime.UtcNow), ct);

        return Result.Success(extractionRun);
    }

    public async Task<ExtractionRun?> GetExtractionRunForDocumentAsync(
        Guid documentId,
        CancellationToken ct = default)
    {
        return await dbContext.ExtractionRuns
            .Include(r => r.Fields)
            .AsNoTracking()
            .OrderByDescending(r => r.ProcessedAtUtc)
            .FirstOrDefaultAsync(r => r.DocumentId == documentId, ct);
    }
}
