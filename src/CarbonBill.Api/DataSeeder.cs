using CarbonBill.Modules.ActivityUnits.Domain;
using CarbonBill.Modules.ActivityUnits.Persistence;
using CarbonBill.Modules.Audit.Persistence;
using CarbonBill.Modules.Calculation.Domain;
using CarbonBill.Modules.Calculation.Persistence;
using CarbonBill.Modules.Documents.Persistence;
using CarbonBill.Modules.Extraction.Persistence;
using CarbonBill.Modules.FactorRegistry.Domain;
using CarbonBill.Modules.FactorRegistry.Persistence;
using CarbonBill.Modules.IdentityTenancy.Domain;
using CarbonBill.Modules.IdentityTenancy.Persistence;
using CarbonBill.Modules.IdentityTenancy.Services;
using CarbonBill.Modules.Onboarding.Domain;
using CarbonBill.Modules.Onboarding.Persistence;
using CarbonBill.Modules.PlatformAdmin.Domain;
using CarbonBill.Modules.PlatformAdmin.Persistence;
using CarbonBill.Modules.Review.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CarbonBill.Api;

public static class DataSeeder
{
    public static async Task SeedDevelopmentDataAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DataSeeder");
        var identityDb = scope.ServiceProvider.GetRequiredService<IdentityTenancyDbContext>();
        var auditDb = scope.ServiceProvider.GetRequiredService<AuditDbContext>();
        var documentsDb = scope.ServiceProvider.GetRequiredService<DocumentsDbContext>();
        var extractionDb = scope.ServiceProvider.GetRequiredService<ExtractionDbContext>();
        var reviewDb = scope.ServiceProvider.GetRequiredService<ReviewDbContext>();
        var onboardingDb = scope.ServiceProvider.GetRequiredService<OnboardingDbContext>();
        var factorDb = scope.ServiceProvider.GetRequiredService<FactorRegistryDbContext>();
        var unitsDb = scope.ServiceProvider.GetRequiredService<ActivityUnitsDbContext>();
        var calcDb = scope.ServiceProvider.GetRequiredService<CalculationDbContext>();
        var adminDb = scope.ServiceProvider.GetRequiredService<PlatformAdminDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        logger.LogInformation("Ensuring SQLite database and tables are created across all modules...");
        var contexts = new DbContext[]
        {
            identityDb,
            auditDb,
            documentsDb,
            extractionDb,
            reviewDb,
            onboardingDb,
            factorDb,
            unitsDb,
            calcDb,
            adminDb
        };

        // Check existing tables to prevent duplicate CREATE TABLE execution errors
        using var connection = identityDb.Database.GetDbConnection();
        await connection.OpenAsync();
        var existingTables = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        using (var cmd = connection.CreateCommand())
        {
            cmd.CommandText = "SELECT name FROM sqlite_master WHERE type='table';";
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                existingTables.Add(reader.GetString(0));
            }
        }

        foreach (var ctx in contexts)
        {
            var hasUncreatedTables = ctx.Model.GetEntityTypes()
                .Select(t => t.GetTableName())
                .Where(n => n != null)
                .Any(n => !existingTables.Contains(n!));

            if (hasUncreatedTables)
            {
                var creator = Microsoft.EntityFrameworkCore.Infrastructure.AccessorExtensions.GetService<Microsoft.EntityFrameworkCore.Storage.IRelationalDatabaseCreator>(ctx.Database);
                try
                {
                    await creator.CreateTablesAsync();
                }
                catch
                {
                    // Catch fallback
                }
            }
        }

        // 1. Seed Factor Sets & Emission Factors if missing
        if (!await factorDb.FactorSets.AnyAsync())
        {
            logger.LogInformation("Seeding published emission factor sets...");
            var factorSet = new FactorSet
            {
                Name = "Bangladesh National Grid & IPCC AR6 Standard",
                GwpBasis = "AR6",
                SourceCitation = "IGES Grid Factor 2024 / DEFRA 2024 / IPCC AR6",
                Year = 2024,
                Region = "BD",
                Version = 1,
                ValidFrom = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                IsPublished = true
            };
            factorDb.FactorSets.Add(factorSet);
            await factorDb.SaveChangesAsync();

            var factors = new List<EmissionFactor>
            {
                new()
                {
                    FactorSetId = factorSet.Id,
                    ActivityType = "grid_electricity",
                    FuelOrMode = "grid",
                    Unit = "kWh",
                    Co2eFactor = 0.621000m,
                    Scope = 2,
                    Tier = "Tier 2",
                    Notes = "IGES Bangladesh National Grid average"
                },
                new()
                {
                    FactorSetId = factorSet.Id,
                    ActivityType = "electricity",
                    FuelOrMode = "grid",
                    Unit = "kWh",
                    Co2eFactor = 0.621000m,
                    Scope = 2,
                    Tier = "Tier 2",
                    Notes = "General electricity alias"
                },
                new()
                {
                    FactorSetId = factorSet.Id,
                    ActivityType = "diesel",
                    FuelOrMode = "diesel",
                    Unit = "litre",
                    Co2eFactor = 2.680000m,
                    Scope = 1,
                    Tier = "Tier 1",
                    Notes = "DEFRA 2024 Diesel 100% mineral"
                },
                new()
                {
                    FactorSetId = factorSet.Id,
                    ActivityType = "naturalgas",
                    FuelOrMode = "gas",
                    Unit = "m3",
                    Co2eFactor = 1.930000m,
                    Scope = 1,
                    Tier = "Tier 1",
                    Notes = "IPCC AR6 Stationary Natural Gas"
                },
                new()
                {
                    FactorSetId = factorSet.Id,
                    ActivityType = "gas",
                    FuelOrMode = "gas",
                    Unit = "m3",
                    Co2eFactor = 1.930000m,
                    Scope = 1,
                    Tier = "Tier 1",
                    Notes = "Gas alias"
                },
                new()
                {
                    FactorSetId = factorSet.Id,
                    ActivityType = "lpg",
                    FuelOrMode = "lpg",
                    Unit = "kg",
                    Co2eFactor = 2.940000m,
                    Scope = 1,
                    Tier = "Tier 1",
                    Notes = "IPCC LPG combustion"
                },
                new()
                {
                    FactorSetId = factorSet.Id,
                    ActivityType = "freight",
                    FuelOrMode = "road_truck",
                    Unit = "tonne_km",
                    Co2eFactor = 0.160000m,
                    Scope = 3,
                    Tier = "Tier 1",
                    Notes = "DEFRA 2024 Rigid HGV Freight Transport"
                }
            };

            factorDb.EmissionFactors.AddRange(factors);
            await factorDb.SaveChangesAsync();
        }

        // 2. Seed Units & Unit Conversions if missing
        if (!await unitsDb.Units.AnyAsync())
        {
            logger.LogInformation("Seeding standard units and canonical conversions...");
            unitsDb.Units.AddRange([
                new Unit { Code = "kWh", NameEn = "Kilowatt Hour", NameBn = "কিলোওয়াট ঘণ্টা", PhysicalQuantity = "Energy" },
                new Unit { Code = "MWh", NameEn = "Megawatt Hour", NameBn = "মেগাওয়াট ঘণ্টা", PhysicalQuantity = "Energy" },
                new Unit { Code = "litre", NameEn = "Litre", NameBn = "লিটার", PhysicalQuantity = "Volume" },
                new Unit { Code = "gallon", NameEn = "Gallon (US)", NameBn = "গ্যালন", PhysicalQuantity = "Volume" },
                new Unit { Code = "m3", NameEn = "Cubic Metre", NameBn = "ঘনমিটার", PhysicalQuantity = "Volume" },
                new Unit { Code = "cft", NameEn = "Cubic Feet", NameBn = "ঘনফুট", PhysicalQuantity = "Volume" },
                new Unit { Code = "kg", NameEn = "Kilogram", NameBn = "কেজি", PhysicalQuantity = "Mass" },
                new Unit { Code = "tonne_km", NameEn = "Tonne-Kilometre", NameBn = "টন-কিলোমিটার", PhysicalQuantity = "Distance/Mass" }
            ]);

            unitsDb.UnitConversions.AddRange([
                new UnitConversion { FromUnit = "mwh", ToUnit = "kwh", ConversionFactor = 1000m, Version = 1 },
                new UnitConversion { FromUnit = "gallon", ToUnit = "litre", ConversionFactor = 3.78541m, Version = 1 },
                new UnitConversion { FromUnit = "cft", ToUnit = "m3", ConversionFactor = 0.0283168m, Version = 1 },
                new UnitConversion { FromUnit = "cylinder_12kg", ToUnit = "kg", ConversionFactor = 12m, Version = 1 },
                new UnitConversion { FromUnit = "cylinder_35kg", ToUnit = "kg", ConversionFactor = 35m, Version = 1 },
                new UnitConversion { FromUnit = "cylinder_45kg", ToUnit = "kg", ConversionFactor = 45m, Version = 1 }
            ]);

            await unitsDb.SaveChangesAsync();
        }

        // 3. Seed Organizations, Users, Sites & Assets if missing
        if (await identityDb.Organizations.AnyAsync())
        {
            logger.LogInformation("Database already contains seed data. Skipping seeding.");
            return;
        }

        logger.LogInformation("Seeding development organizations, users, memberships, sites, and demo invitation...");

        // Create Demo Organization
        var apexOrg = new Organization
        {
            Name = "Apex Textile & Garments Ltd.",
            Slug = "apex-textiles",
            Sector = "RMG",
            IsActive = true
        };
        identityDb.Organizations.Add(apexOrg);

        // Platform Admin
        var adminUser = new User
        {
            Email = "admin@carbonbill.local",
            FullName = "Platform Administrator",
            PasswordHash = passwordHasher.HashPassword("Admin1234!"),
            PreferredLanguage = "en",
            IsPlatformAdmin = true
        };
        identityDb.Users.Add(adminUser);

        // Factory Owner (Kabir)
        var ownerUser = new User
        {
            Email = "owner@apex.local",
            FullName = "Kabir Ahmed",
            PasswordHash = passwordHasher.HashPassword("Pass1234!"),
            PreferredLanguage = "bn"
        };
        identityDb.Users.Add(ownerUser);

        // Accountant (Rahim)
        var accountantUser = new User
        {
            Email = "accountant@apex.local",
            FullName = "Rahim Mia",
            PasswordHash = passwordHasher.HashPassword("Pass1234!"),
            PreferredLanguage = "bn"
        };
        identityDb.Users.Add(accountantUser);

        // Compliance Officer (Nusrat)
        var complianceUser = new User
        {
            Email = "compliance@apex.local",
            FullName = "Nusrat Jahan",
            PasswordHash = passwordHasher.HashPassword("Pass1234!"),
            PreferredLanguage = "bn"
        };
        identityDb.Users.Add(complianceUser);

        // Floor Staff (Jahid)
        var floorUser = new User
        {
            Email = "floor@apex.local",
            FullName = "Jahid Hasan",
            PhoneNumber = "01700000000",
            PasswordHash = passwordHasher.HashPassword("Pass1234!"),
            PreferredLanguage = "bn"
        };
        identityDb.Users.Add(floorUser);

        // Sustainability Consultant (Farhana)
        var consultantUser = new User
        {
            Email = "consultant@greenadvisory.local",
            FullName = "Farhana Rahman",
            PasswordHash = passwordHasher.HashPassword("Pass1234!"),
            PreferredLanguage = "en"
        };
        identityDb.Users.Add(consultantUser);

        await identityDb.SaveChangesAsync();

        // Assign Memberships
        identityDb.Memberships.AddRange([
            new Membership { UserId = ownerUser.Id, OrgId = apexOrg.Id, Role = Roles.Owner },
            new Membership { UserId = accountantUser.Id, OrgId = apexOrg.Id, Role = Roles.Accountant },
            new Membership { UserId = complianceUser.Id, OrgId = apexOrg.Id, Role = Roles.Compliance },
            new Membership { UserId = floorUser.Id, OrgId = apexOrg.Id, Role = Roles.FloorStaff },
            new Membership { UserId = consultantUser.Id, OrgId = apexOrg.Id, Role = Roles.Consultant },
            new Membership { UserId = adminUser.Id, OrgId = apexOrg.Id, Role = Roles.PlatformAdmin }
        ]);

        // Create Demo QR + PIN invitation for Floor Staff
        var invitation = new Invitation
        {
            OrgId = apexOrg.Id,
            Role = Roles.FloorStaff,
            Token = "apex-floor-demo",
            PinHash = passwordHasher.HashPassword("1234"),
            ExpiresAtUtc = DateTime.UtcNow.AddYears(1),
            CreatedByUserId = ownerUser.Id,
            MaxUses = 100
        };
        identityDb.Invitations.Add(invitation);
        await identityDb.SaveChangesAsync();

        // Seed Onboarding Site & Assets for Apex
        var site = new Site
        {
            OrgId = apexOrg.Id,
            Name = "Savar Export Processing Unit",
            Address = "Plot 12-14, DEPZ, Savar",
            City = "Dhaka",
            IsPrimary = true
        };
        onboardingDb.Sites.Add(site);
        await onboardingDb.SaveChangesAsync();

        var meterAsset = new Asset
        {
            OrgId = apexOrg.Id,
            SiteId = site.Id,
            Type = "meter",
            Name = "DESCO Main HT Substation Meter",
            IdentifierOrMeterNumber = "MTR-DEPZ-0891",
            FuelOrEnergyType = "electricity"
        };
        var gensetAsset = new Asset
        {
            OrgId = apexOrg.Id,
            SiteId = site.Id,
            Type = "genset",
            Name = "Cummins 500 kVA Backup Diesel Generator",
            IdentifierOrMeterNumber = "GEN-CUMM-01",
            FuelOrEnergyType = "diesel"
        };
        var boilerAsset = new Asset
        {
            OrgId = apexOrg.Id,
            SiteId = site.Id,
            Type = "boiler",
            Name = "Thermex Gas Steam Boiler 4T",
            IdentifierOrMeterNumber = "BLR-THX-01",
            FuelOrEnergyType = "gas"
        };
        onboardingDb.Assets.AddRange(meterAsset, gensetAsset, boilerAsset);
        await onboardingDb.SaveChangesAsync();

        onboardingDb.ExpectedDocRules.AddRange([
            new ExpectedDocRule { OrgId = apexOrg.Id, AssetId = meterAsset.Id, DocType = "ElectricityBill", Frequency = "Monthly", DueDayOfMonth = 10, IsActive = true },
            new ExpectedDocRule { OrgId = apexOrg.Id, AssetId = gensetAsset.Id, DocType = "diesel_slip", Frequency = "Monthly", DueDayOfMonth = 5, IsActive = true },
            new ExpectedDocRule { OrgId = apexOrg.Id, AssetId = boilerAsset.Id, DocType = "gas_bill", Frequency = "Monthly", DueDayOfMonth = 15, IsActive = true }
        ]);

        onboardingDb.FacilityProfiles.Add(new FacilityProfile
        {
            OrgId = apexOrg.Id,
            HasBoiler = true,
            HasGenset = true,
            RoofAreaSqFt = 35000,
            BuildingOwnership = "Owned",
            BudgetBandBdt = "1000000-5000000",
            AnnualProductionVolume = 1200000,
            ProductionUnit = "piece",
            UpdatedAtUtc = DateTime.UtcNow
        });
        await onboardingDb.SaveChangesAsync();

        // Seed Dataset Version
        adminDb.DatasetVersions.Add(new DatasetVersion
        {
            Kind = "Factors",
            Version = "2024.1",
            Description = "Bangladesh Grid + IPCC AR6 Seed Factors",
            RecordCount = 7,
            ChecksumSha256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            UploadedByUserId = adminUser.Id,
            UploadedAtUtc = DateTime.UtcNow,
            IsActive = true
        });
        await adminDb.SaveChangesAsync();

        logger.LogInformation("Database seeding completed successfully!");
    }
}
