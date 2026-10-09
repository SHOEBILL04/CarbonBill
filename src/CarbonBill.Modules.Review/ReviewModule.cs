using CarbonBill.Modules.Review.Endpoints;
using CarbonBill.Modules.Review.Persistence;
using CarbonBill.Modules.Review.Services;
using CarbonBill.SharedKernel.Contracts;
using CarbonBill.SharedKernel.Persistence;
using CarbonBill.SharedKernel.Providers.Stubs;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace CarbonBill.Modules.Review;

public static class ReviewModuleExtensions
{
    public static IServiceCollection AddReviewModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? "Data Source=carbonbill.db;Cache=Shared";

        services.AddDbContext<ReviewDbContext>((sp, options) =>
        {
            options.UseSqlite(connectionString);
            options.AddInterceptors(
                sp.GetRequiredService<SqlitePragmaInterceptor>(),
                sp.GetRequiredService<TenantSaveChangesInterceptor>());
        });

        // Register default fake IActivityWriter if not already registered (until A5 lands)
        services.TryAddScoped<IActivityWriter, FakeActivityWriter>();

        services.AddScoped<IReviewService, ReviewService>();

        return services;
    }

    public static IEndpointRouteBuilder MapReviewModuleEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapReviewEndpoints();
        return endpoints;
    }
}
