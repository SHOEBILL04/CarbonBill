using CarbonBill.SharedKernel.Domain;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CarbonBill.Modules.PlatformAdmin;

public class DatasetVersion : BaseEntity
{
    public string Kind { get; set; } = string.Empty; // EmissionFactors, MeasureLibrary, Benchmarks
    public string VersionTag { get; set; } = "v1.0.0";
    public string ChecksumSha256 { get; set; } = string.Empty;
    public string SourceMetadataJson { get; set; } = "{}";
    public Guid LoadedByUserId { get; set; }
    public DateTime PublishedAtUtc { get; set; } = DateTime.UtcNow;
}

public static class PlatformAdminModuleExtensions
{
    public static IServiceCollection AddPlatformAdminModule(this IServiceCollection services, IConfiguration configuration)
    {
        // Module shell DI registration
        return services;
    }
}
