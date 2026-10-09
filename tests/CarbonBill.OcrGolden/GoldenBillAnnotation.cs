using System.Text.Json.Serialization;

namespace CarbonBill.OcrGolden;

public record GoldenBillAnnotation(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("fileName")] string FileName,
    [property: JsonPropertyName("category")] string Category, // Electricity, Diesel, Gas, Transport
    [property: JsonPropertyName("rawTextFixture")] string RawTextFixture,
    [property: JsonPropertyName("expectedVendor")] string ExpectedVendor,
    [property: JsonPropertyName("expectedBillNumber")] string ExpectedBillNumber,
    [property: JsonPropertyName("expectedBillingPeriod")] string ExpectedBillingPeriod,
    [property: JsonPropertyName("expectedQuantity")] decimal ExpectedQuantity,
    [property: JsonPropertyName("expectedUnit")] string ExpectedUnit,
    [property: JsonPropertyName("expectedAmountBdt")] decimal ExpectedAmountBdt,
    [property: JsonPropertyName("expectedMeterNumber")] string? ExpectedMeterNumber = null,
    [property: JsonPropertyName("expectedPenaltyBdt")] decimal? ExpectedPenaltyBdt = null);

public record GoldenFieldEvaluation(
    string FieldName,
    string? Expected,
    string? Actual,
    bool IsMatch,
    float Confidence);

public record GoldenDocumentEvaluation(
    string Id,
    string FileName,
    string Category,
    int TierUsed,
    bool NeedsHumanReview,
    float OverallConfidence,
    IReadOnlyList<GoldenFieldEvaluation> FieldEvaluations);

public record GoldenHarnessReport(
    int TotalDocuments,
    int Tier1Count,
    int Tier2Count,
    int Tier3Count,
    double OverallAccuracyPercentage,
    double NeedsCorrectionPercentage,
    IReadOnlyDictionary<string, double> AccuracyPerField,
    IReadOnlyList<GoldenDocumentEvaluation> DocumentEvaluations,
    DateTime GeneratedAtUtc);
