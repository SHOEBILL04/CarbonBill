using System.Security.Cryptography;

namespace CarbonBill.Modules.Documents.Services;

public record FileValidationResult(
    bool IsValid,
    string? ErrorMessage,
    string? DetectedContentType,
    string? Sha256Hash,
    long FileSizeBytes);

public static class DocumentFileValidator
{
    public const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB limit

    private static readonly byte[] JpegHeader = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] PngHeader = [0x89, 0x50, 0x4E, 0x47];
    private static readonly byte[] PdfHeader = [0x25, 0x50, 0x44, 0x46]; // %PDF
    private static readonly byte[] RiffHeader = [0x52, 0x49, 0x46, 0x46]; // RIFF
    private static readonly byte[] WebpHeader = [0x57, 0x45, 0x42, 0x50]; // WEBP

    public static async Task<FileValidationResult> ValidateAsync(Stream stream, string claimedContentType, CancellationToken ct = default)
    {
        if (stream == null || stream.Length == 0)
        {
            return new FileValidationResult(false, "File stream is empty.", null, null, 0);
        }

        if (stream.Length > MaxFileSizeBytes)
        {
            return new FileValidationResult(false, $"File size ({stream.Length / (1024 * 1024)}MB) exceeds maximum limit of 10MB.", null, null, stream.Length);
        }

        // Read first 16 bytes for magic bytes detection
        var header = new byte[16];
        stream.Seek(0, SeekOrigin.Begin);
        var bytesRead = await stream.ReadAsync(header.AsMemory(0, header.Length), ct);
        if (bytesRead < 4)
        {
            return new FileValidationResult(false, "File header is too short to be a valid document.", null, null, stream.Length);
        }

        string? detectedContentType = DetectContentType(header);
        if (detectedContentType == null)
        {
            return new FileValidationResult(false, "Unsupported or disguised file format. Allowed types: JPEG, PNG, WebP, PDF.", null, null, stream.Length);
        }

        // Compute SHA-256 hash
        stream.Seek(0, SeekOrigin.Begin);
        using var sha256 = SHA256.Create();
        var hashBytes = await sha256.ComputeHashAsync(stream, ct);
        var hashHex = Convert.ToHexString(hashBytes).ToLowerInvariant();

        stream.Seek(0, SeekOrigin.Begin);
        return new FileValidationResult(true, null, detectedContentType, hashHex, stream.Length);
    }

    private static string? DetectContentType(byte[] header)
    {
        // JPEG check
        if (header.Length >= 3 && header[0] == JpegHeader[0] && header[1] == JpegHeader[1] && header[2] == JpegHeader[2])
        {
            return "image/jpeg";
        }

        // PNG check
        if (header.Length >= 4 && header.Take(4).SequenceEqual(PngHeader))
        {
            return "image/png";
        }

        // PDF check
        if (header.Length >= 4 && header.Take(4).SequenceEqual(PdfHeader))
        {
            return "application/pdf";
        }

        // WebP check (RIFF....WEBP)
        if (header.Length >= 12 &&
            header.Take(4).SequenceEqual(RiffHeader) &&
            header.Skip(8).Take(4).SequenceEqual(WebpHeader))
        {
            return "image/webp";
        }

        return null;
    }
}
