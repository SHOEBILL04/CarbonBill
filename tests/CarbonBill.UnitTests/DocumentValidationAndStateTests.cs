using System.Text;
using CarbonBill.Modules.Documents.Domain;
using CarbonBill.Modules.Documents.Services;

namespace CarbonBill.UnitTests;

public class DocumentValidationAndStateTests
{
    [Fact]
    public async Task ValidateAsync_ValidJpegHeader_ReturnsSuccess()
    {
        // Arrange: Valid JPEG header (FF D8 FF E0 ...)
        var jpegBytes = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46 };
        using var stream = new MemoryStream(jpegBytes);

        // Act
        var result = await DocumentFileValidator.ValidateAsync(stream, "image/jpeg");

        // Assert
        Assert.True(result.IsValid);
        Assert.Equal("image/jpeg", result.DetectedContentType);
        Assert.NotNull(result.Sha256Hash);
        Assert.Equal(10, result.FileSizeBytes);
    }

    [Fact]
    public async Task ValidateAsync_ValidPngHeader_ReturnsSuccess()
    {
        // Arrange: Valid PNG header (89 50 4E 47 ...)
        var pngBytes = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
        using var stream = new MemoryStream(pngBytes);

        // Act
        var result = await DocumentFileValidator.ValidateAsync(stream, "image/png");

        // Assert
        Assert.True(result.IsValid);
        Assert.Equal("image/png", result.DetectedContentType);
    }

    [Fact]
    public async Task ValidateAsync_ValidPdfHeader_ReturnsSuccess()
    {
        // Arrange: Valid PDF header (%PDF ...)
        var pdfBytes = Encoding.ASCII.GetBytes("%PDF-1.4 sample content");
        using var stream = new MemoryStream(pdfBytes);

        // Act
        var result = await DocumentFileValidator.ValidateAsync(stream, "application/pdf");

        // Assert
        Assert.True(result.IsValid);
        Assert.Equal("application/pdf", result.DetectedContentType);
    }

    [Fact]
    public async Task ValidateAsync_DisguisedFile_RejectsInvalidFormat()
    {
        // Arrange: An executable or plain text masquerading as JPEG
        var fakeBytes = Encoding.ASCII.GetBytes("MZ disguised windows binary file content");
        using var stream = new MemoryStream(fakeBytes);

        // Act
        var result = await DocumentFileValidator.ValidateAsync(stream, "image/jpeg");

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains("Unsupported or disguised file format", result.ErrorMessage);
    }

    [Fact]
    public async Task ValidateAsync_EmptyStream_RejectsEmpty()
    {
        // Arrange
        using var stream = new MemoryStream();

        // Act
        var result = await DocumentFileValidator.ValidateAsync(stream, "image/jpeg");

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains("empty", result.ErrorMessage);
    }

    [Fact]
    public void Document_StateTransitions_GuardsRespectStatusRules()
    {
        // Arrange
        var doc = new Document
        {
            Id = Guid.NewGuid(),
            OrgId = Guid.NewGuid(),
            Status = DocumentStatuses.Uploaded
        };

        // Act & Assert valid progression
        Assert.True(doc.TransitionTo(DocumentStatuses.Queued).IsSuccess);
        Assert.True(doc.TransitionTo(DocumentStatuses.Extracting).IsSuccess);
        Assert.True(doc.TransitionTo(DocumentStatuses.NeedsReview).IsSuccess);
        Assert.True(doc.TransitionTo(DocumentStatuses.Confirmed).IsSuccess);
        Assert.True(doc.TransitionTo(DocumentStatuses.Calculated).IsSuccess);
        Assert.True(doc.TransitionTo(DocumentStatuses.InReport).IsSuccess);
        Assert.True(doc.TransitionTo(DocumentStatuses.Locked).IsSuccess);

        // Locked documents cannot transition further
        var lockedTransition = doc.TransitionTo(DocumentStatuses.NeedsReview);
        Assert.False(lockedTransition.IsSuccess);
        Assert.Contains("Locked", lockedTransition.Error);
    }

    [Fact]
    public void Document_InvalidStatus_RejectedByGuard()
    {
        // Arrange
        var doc = new Document { Status = DocumentStatuses.Uploaded };

        // Act
        var result = doc.TransitionTo("ArbitraryBogusStatus");

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("Invalid document status", result.Error);
    }
}
