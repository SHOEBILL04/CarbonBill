using CarbonBill.SharedKernel.Domain;
using CarbonBill.SharedKernel.Tenancy;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CarbonBill.Modules.Onboarding;

public class Site : BaseEntity, ITenantScopedEntity
{
    public Guid OrgId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? City { get; set; }
    public bool IsPrimary { get; set; } = true;
    public List<Asset> Assets { get; set; } = [];
}

public class Asset : BaseEntity, ITenantScopedEntity
{
    public Guid OrgId { get; set; }
    public Guid SiteId { get; set; }
    public Site Site { get; set; } = null!;
    public string Type { get; set; } = "meter"; // meter, genset, boiler, vehicle
    public string Name { get; set; } = string.Empty;
    public string? IdentifierOrMeterNumber { get; set; }
    public string? FuelOrEnergyType { get; set; } // electricity, diesel, gas, lpg
    public List<ExpectedDocRule> ExpectedDocRules { get; set; } = [];
}

public class ExpectedDocRule : BaseEntity, ITenantScopedEntity
{
    public Guid OrgId { get; set; }
    public Guid AssetId { get; set; }
    public Asset Asset { get; set; } = null!;
    public string DocType { get; set; } = "ElectricityBill";
    public string Frequency { get; set; } = "Monthly"; // Monthly, Quarterly, PerDelivery
    public int DueDayOfMonth { get; set; } = 15;
    public Guid? ResponsibleUserId { get; set; }
}

public static class OnboardingModuleExtensions
{
    public static IServiceCollection AddOnboardingModule(this IServiceCollection services, IConfiguration configuration)
    {
        // Module shell DI registration
        return services;
    }
}
