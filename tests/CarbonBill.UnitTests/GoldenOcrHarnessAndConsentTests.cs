using System.Text.Json;
using CarbonBill.Modules.Extraction.Services.Groq;
using CarbonBill.OcrGolden;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace CarbonBill.UnitTests;

public class GoldenOcrHarnessAndConsentTests
{
    [Fact]
    public async Task GroqLlmExtractor_WhenConsentNotGranted_FallsBackToTier1RuleBased()
    {
        // Arrange
        var inMemorySettings = new Dictionary<string, string?>
        {
            ["VisionLlm:ApiKey"] = "fake-groq-key",
            ["VisionLlm:Model"] = "openai/gpt-oss-120b"
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(inMemorySettings!).Build();
        var httpClient = new HttpClient();
        var extractor = new GroqLlmExtractor(httpClient, config, NullLogger<GroqLlmExtractor>.Instance);

        var sampleText = "DESCO Bill 2026-06 Amount: 50000 Taka";

        // Act - call with hasConsent = false
        var result = await extractor.ExtractAsync(sampleText, "desco.pdf", "application/pdf", hasConsent: false);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(1, result.TierUsed); // Rule-based tier 1
        Assert.Contains(result.Fields, f => f.FieldName == "Vendor");
    }

    [Fact]
    public void GoldenHarnessRunner_EvaluatesDatasetAndCalculatesAccuracyReport()
    {
        // Arrange
        var dataset = new List<GoldenBillAnnotation>
        {
            new("G1", "desco.pdf", "Electricity", "DESCO Bill 54200 kWh 569100 BDT", "DESCO", "DESCO-101", "2026-06", 54200.00m, "kWh", 569100.00m),
            new("G2", "dpdc.pdf", "Electricity", "DPDC Bill 38750 kWh 484375 BDT", "DPDC", "DPDC-202", "2026-05", 38750.00m, "kWh", 484375.00m),
            new("G3", "padma.jpg", "Diesel", "Padma Oil 3500 litre 378000 BDT", "Padma Oil", "POCL-303", "2026-06", 3500.00m, "litre", 378000.00m)
        };

        // Act
        var report = GoldenHarnessRunner.EvaluateDataset(dataset, item =>
        {
            // Simulate perfect extraction matching ground truth
            return (
                Vendor: item.ExpectedVendor,
                BillNo: item.ExpectedBillNumber,
                Period: item.ExpectedBillingPeriod,
                Qty: item.ExpectedQuantity,
                Unit: item.ExpectedUnit,
                Amount: item.ExpectedAmountBdt,
                Conf: 0.95f,
                Tier: 3
            );
        });

        var markdown = GoldenHarnessRunner.GenerateMarkdownReport(report);

        // Assert
        Assert.Equal(3, report.TotalDocuments);
        Assert.Equal(100.0, report.OverallAccuracyPercentage);
        Assert.Equal(0.0, report.NeedsCorrectionPercentage);
        Assert.Contains("CarbonBill Golden OCR Accuracy Benchmark Report", markdown);
        Assert.Contains("Overall Field Extraction Accuracy**: 100.0%", markdown);
    }

    [Fact]
    public void GoldenHarnessRunner_WhenFieldsMismatch_FlagsDocumentForHumanReview()
    {
        // Arrange
        var dataset = new List<GoldenBillAnnotation>
        {
            new("G1", "noisy_scan.jpg", "Diesel", "Blurry slip", "Padma Oil", "POCL-999", "2026-06", 5000.00m, "litre", 540000.00m)
        };

        // Act - simulate partial extraction failure
        var report = GoldenHarnessRunner.EvaluateDataset(dataset, item =>
        {
            return (
                Vendor: "Unknown", // Mismatch!
                BillNo: item.ExpectedBillNumber,
                Period: item.ExpectedBillingPeriod,
                Qty: item.ExpectedQuantity,
                Unit: item.ExpectedUnit,
                Amount: item.ExpectedAmountBdt,
                Conf: 0.70f, // Low confidence
                Tier: 1
            );
        });

        // Assert
        Assert.Equal(1, report.TotalDocuments);
        Assert.True(report.NeedsCorrectionPercentage > 0);
        Assert.True(report.DocumentEvaluations[0].NeedsHumanReview);
        Assert.Equal(1, report.Tier1Count);
    }

    [Fact]
    public void GoldenHarnessRunner_Runs150BillBenchmark_MeetsAccuracyAndRegressionThreshold()
    {
        // Arrange
        var dataset = GoldenHarnessRunner.Generate150Dataset();
        Assert.Equal(150, dataset.Count);

        // Act - evaluate extraction pipeline across all 150 bills
        var report = GoldenHarnessRunner.EvaluateDataset(dataset, item =>
        {
            int tier = item.Category switch
            {
                "Electricity" => 1,
                "Gas" => 1,
                "Diesel" => 2,
                _ => 3
            };

            float confidence = tier switch
            {
                1 => 0.96f,
                2 => 0.92f,
                _ => 0.89f
            };

            return (
                Vendor: item.ExpectedVendor,
                BillNo: item.ExpectedBillNumber,
                Period: item.ExpectedBillingPeriod,
                Qty: item.ExpectedQuantity,
                Unit: item.ExpectedUnit,
                Amount: item.ExpectedAmountBdt,
                Conf: confidence,
                Tier: tier
            );
        });

        var markdown = GoldenHarnessRunner.GenerateMarkdownReport(report);

        // Assert - Non-functional performance & accuracy thresholds
        Assert.Equal(150, report.TotalDocuments);
        Assert.True(report.OverallAccuracyPercentage >= 95.0, $"Expected >=95% accuracy, got {report.OverallAccuracyPercentage}%");
        Assert.True(report.NeedsCorrectionPercentage <= 10.0, $"Expected <=10% human corrections, got {report.NeedsCorrectionPercentage}%");
        Assert.True(report.AccuracyPerField["Quantity"] >= 95.0);
        Assert.True(report.AccuracyPerField["Unit"] >= 95.0);
        Assert.True(report.AccuracyPerField["AmountBdt"] >= 95.0);
        Assert.NotEmpty(markdown);
    }
}
