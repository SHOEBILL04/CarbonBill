namespace CarbonBill.Modules.Review.Services;

public record ReviewQueueItemDto(
    Guid DocumentId,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    string Status,
    string? DocType,
    DateTime CapturedAtUtc,
    float OverallConfidence,
    int? TierUsed,
    bool IsEstimated,
    IReadOnlyList<ReviewFieldDto> Fields);

public record ReviewFieldDto(
    Guid Id,
    string FieldName,
    string RawValue,
    string? NormalizedValue,
    string? CorrectedValue,
    float Confidence,
    int SourceTier,
    string? BoundingBoxJson);

public record UpdateFieldsRequest(
    Dictionary<string, string> FieldCorrections,
    string? Notes = null);

public record ConfirmDocumentRequest(
    string? ActivityType = null,
    decimal? OverrideQuantity = null,
    string? OverrideUnit = null,
    decimal? OverrideAmountBdt = null,
    string? OverridePeriod = null,
    bool IsEstimated = false,
    Guid? ResolveDuplicateWithDocId = null,
    string? Notes = null);

public record BulkConfirmRequest(
    List<Guid> DocumentIds);

public record BulkConfirmResultDto(
    int TotalProcessed,
    int Succeeded,
    int Failed,
    List<string> Errors);
