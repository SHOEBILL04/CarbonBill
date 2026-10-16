using CarbonBill.Modules.Extraction.Services.Classification;
using CarbonBill.Modules.Extraction.Services.Normalization;
using CarbonBill.Modules.Extraction.Services.Providers;
using Xunit;

namespace CarbonBill.UnitTests;

public class ExtractionAndNormalizationTests
{
    [Theory]
    [InlineData("১২৩৪৫৬৭৮৯০", "1234567890")]
    [InlineData("মোট বিদ্যুৎ খরচ: ৫৪২০ টাকা", "মোট বিদ্যুৎ খরচ: 5420 টাকা")]
    [InlineData("মিটার নং- ৯৮৭৬৫৪৩২১০", "মিটার নং- 9876543210")]
    [InlineData("১২,৩৫০.৭৫", "12,350.75")]
    [InlineData("", "")]
    [InlineData(null, "")]
    public void NormalizeDigits_ConvertsBanglaNumeralsToLatinDigits(string? input, string expected)
    {
        var result = BanglaNormalizer.NormalizeDigits(input);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("লিটার", "litre")]
    [InlineData("লিঃ", "litre")]
    [InlineData("ltr", "litre")]
    [InlineData("কেডব্লিউএইচ", "kWh")]
    [InlineData("কিলোওয়াট", "kWh")]
    [InlineData("ইউনিট", "kWh")]
    [InlineData("kwh", "kWh")]
    [InlineData("কেজি", "kg")]
    [InlineData("ঘনমিটার", "m3")]
    [InlineData("cu.m", "m3")]
    public void NormalizeUnit_MapsToCanonicalUnits(string input, string expected)
    {
        var result = BanglaNormalizer.NormalizeUnit(input);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("মোট ৫,৪৫০.৭৫ লিটার", 5450.75)]
    [InlineData("বিল: ১২৫০ টাকা", 1250.0)]
    [InlineData("৮৭৬.৫ কেডব্লিউএইচ", 876.5)]
    [InlineData("কোন সংখ্যা নেই", null)]
    public void ExtractNumericValue_ParsesBanglaAndLatinFloats(string input, double? expectedDouble)
    {
        var result = BanglaNormalizer.ExtractNumericValue(input);
        if (expectedDouble.HasValue)
        {
            Assert.NotNull(result);
            Assert.Equal((decimal)expectedDouble.Value, result!.Value);
        }
        else
        {
            Assert.Null(result);
        }
    }

    [Theory]
    [InlineData("DESCO Monthly Electricity Bill for June 2026. Sanctioned load 500KW", "desco_june.pdf", DocumentTypes.ElectricityBill)]
    [InlineData("DPDC LT-Industrial Power Bill with Power Factor Penalty", "dpdc_slip.png", DocumentTypes.ElectricityBill)]
    [InlineData("PADMA OIL COMPANY LIMITED - Diesel Delivery Challan for Generator", "padma_oil.jpg", DocumentTypes.DieselSlip)]
    [InlineData("মেঘনা পেট্রোলিয়াম ডিজেল স্লিপ চালান নং ১২৩৪৫", "challan.jpg", DocumentTypes.DieselSlip)]
    [InlineData("TITAS GAS TRANSMISSION AND DISTRIBUTION CO - RMS Monthly Consumption m3", "titas_gas.pdf", DocumentTypes.GasBill)]
    [InlineData("গ্যাস বিল তিতাস বিতরণ কোম্পানি", "bill.pdf", DocumentTypes.GasBill)]
    [InlineData("Inter-district truck cargo delivery challan freight transport", "transport.pdf", DocumentTypes.ShippingChallan)]
    [InlineData("Random miscellaneous meeting notes without power keywords", "notes.txt", DocumentTypes.Unknown)]
    public void DocumentClassifier_CorrectlyIdentifiesBangladeshiDocumentTypes(string text, string fileName, string expectedType)
    {
        var result = DocumentClassifier.Classify(text, fileName);
        Assert.Equal(expectedType, result.DocumentType);
        if (expectedType != DocumentTypes.Unknown)
        {
            Assert.True(result.Confidence >= 0.85f);
        }
    }

    [Fact]
    public void EvaluateAccuracy_AcceptsValidBanglaElectricityBill()
    {
        var text = "ঢাকা পাওয়ার ডিস্ট্রিবিউশন কোম্পানি লিমিটেড (ডিপিডিসি) বিদ্যুৎ বিল হিসাবের মাস সেপ্টেম্বর ২০২৬। ব্যবহৃত ইউনিট ৪৩৯ kWh। মোট প্রদেয় টাকা ৪৪৪৫.০০ BDT। মিটার নং ৯৮৭৬৫৪৩২।";
        var (isAcceptable, score, details) = DualOcrEngine.EvaluateAccuracy(text);
        
        Assert.True(isAcceptable);
        Assert.True(score >= 0.60);
        Assert.Contains("CompositeScore", details);
    }

    [Fact]
    public void EvaluateAccuracy_AcceptsValidEnglishFuelChallan()
    {
        var text = "PADMA OIL COMPANY LIMITED. Diesel Delivery Challan No: CH-8812. Date: 08/10/2026. Product: Diesel Fuel. Quantity: 250 Liters. Rate: 110 TK. Total Amount: 27,500.00 BDT.";
        var (isAcceptable, score, details) = DualOcrEngine.EvaluateAccuracy(text);

        Assert.True(isAcceptable);
        Assert.True(score >= 0.60);
    }

    [Theory]
    [InlineData("7\n\f\f")]
    [InlineData("abc xyz some random unrecognised text without numbers")]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("স্বাভাবিক পাঠোদ্ধার সম্পন্ন")]
    public void EvaluateAccuracy_RejectsLowAccuracyOrGarbledText(string? lowQualityText)
    {
        var (isAcceptable, score, details) = DualOcrEngine.EvaluateAccuracy(lowQualityText);

        Assert.False(isAcceptable);
        Assert.True(score < 0.60);
    }

    [Fact]
    public void FallbackRuleBasedExtraction_ComputesCalibratedConfidenceScores_NotFixed95Percent()
    {
        // Text with clear provider, amount and quantity
        var text = "BPDB Electricity Bill 2026-08 Bill No: 172938491 Amount: 54000 BDT Consumed Unit: 4500 kWh";
        var result = CarbonBill.Modules.Extraction.Services.Groq.GroqLlmExtractor.FallbackRuleBasedExtraction(text, "bpdb.pdf");

        Assert.True(result.Success);
        Assert.NotNull(result.OverallConfidence);
        // Should not be hardcoded 0.95
        Assert.NotEqual(0.95f, result.OverallConfidence.Value);
        Assert.True(result.OverallConfidence.Value >= 0.70f && result.OverallConfidence.Value <= 0.95f);

        // Core fields should have individual calibrated scores
        var vendorField = result.Fields.FirstOrDefault(f => f.FieldName == "Vendor");
        Assert.NotNull(vendorField);
        Assert.Equal(0.88f, vendorField.Confidence);
    }

    [Fact]
    public void FallbackRuleBasedExtraction_WhenQuantityIsDerived_LowersConfidence()
    {
        // Bill with amount but without explicit kWh or meter readings
        var text = "BPDB Electricity Bill 2026-08 Bill No: 172938491 Amount: 5500.00 BDT";
        var result = CarbonBill.Modules.Extraction.Services.Groq.GroqLlmExtractor.FallbackRuleBasedExtraction(text, "bpdb.pdf");

        Assert.True(result.Success);
        Assert.NotNull(result.OverallConfidence);
        var qtyField = result.Fields.FirstOrDefault(f => f.FieldName == "Quantity");
        Assert.NotNull(qtyField);
        // Derived quantity must have lower confidence score (0.62) indicating it was estimated from tariffs
        Assert.Equal(0.62f, qtyField.Confidence);
        Assert.True(result.OverallConfidence!.Value < 0.85f);
    }
}

