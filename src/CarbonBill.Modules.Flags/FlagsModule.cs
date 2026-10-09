using CarbonBill.Modules.Flags.Contracts;
using CarbonBill.Modules.Flags.Endpoints;
using CarbonBill.Modules.Flags.Engine;
using CarbonBill.Modules.Flags.Fakes;
using CarbonBill.Modules.Flags.Handlers;
using CarbonBill.Modules.Flags.Jobs;
using CarbonBill.Modules.Flags.Persistence;
using CarbonBill.Modules.Flags.Seeds;
using CarbonBill.Modules.Flags.Services;
using CarbonBill.SharedKernel.Contracts;
using CarbonBill.SharedKernel.Events;
using CarbonBill.SharedKernel.Persistence;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace CarbonBill.Modules.Flags;

public static class FlagsModuleExtensions
{
    public static IServiceCollection AddFlagsModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Data Source=carbonbill.db;Cache=Shared";

        services.AddDbContext<FlagsDbContext>((sp, options) =>
        {
            options.UseSqlite(connectionString);
            options.AddInterceptors(
                sp.GetRequiredService<SqlitePragmaInterceptor>(),
                sp.GetRequiredService<TenantSaveChangesInterceptor>());
        });

        // Fallback fakes for read models until A5/B1 land
        services.TryAddScoped<IFlagDocumentReadModel, FakeFlagDocumentReadModel>();
        services.TryAddScoped<IFlagEmissionReadModel, FakeFlagEmissionReadModel>();
        services.TryAddScoped<IExpectedDocRuleReader, FakeExpectedDocRuleReader>();
        services.TryAddScoped<IDocumentReadModel, FakeDocumentReadModel>();

        // Seed loader
        services.AddScoped<IFlagRuleSeedLoader, FlagRuleSeedLoader>();

        // Rule evaluators (Data-Quality rules)
        services.AddScoped<IFlagRuleEvaluator, MissingDocumentRuleEvaluator>();
        services.AddScoped<IFlagRuleEvaluator, LowOcrConfidenceRuleEvaluator>();
        services.AddScoped<IFlagRuleEvaluator, DuplicateSuspectedRuleEvaluator>();
        services.AddScoped<IFlagRuleEvaluator, ImplausibleValueRuleEvaluator>();
        services.AddScoped<IFlagRuleEvaluator, EstimatedShareHighRuleEvaluator>();

        // Core flag service and interfaces
        services.AddScoped<FlagsService>();
        services.AddScoped<IFlagRaiser>(sp => sp.GetRequiredService<FlagsService>());
        services.AddScoped<IFlagReader>(sp => sp.GetRequiredService<FlagsService>());
        services.AddScoped<IFlagEngine>(sp => sp.GetRequiredService<FlagsService>());

        // Hangfire Nightly Job
        services.AddScoped<INightlyFlagEvaluationJob, NightlyFlagEvaluationJob>();

        // Domain event handlers
        services.AddScoped<IDomainEventHandler<DocumentConfirmedEvent>, DocumentConfirmedEventHandler>();
        services.AddScoped<IDomainEventHandler<EmissionCalculatedEvent>, EmissionCalculatedEventHandler>();

        return services;
    }

    public static IEndpointRouteBuilder MapFlagsModuleEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapFlagEndpoints();
        return endpoints;
    }
}
