using CarbonBill.Modules.Audit.Persistence;
using CarbonBill.Modules.Audit.Services;
using CarbonBill.SharedKernel.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CarbonBill.Modules.Audit;

public static class AuditModuleExtensions
{
    public static IServiceCollection AddAuditModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Data Source=/data/carbonbill.db;Cache=Shared";

        services.AddDbContext<AuditDbContext>((sp, options) =>
        {
            var pragmaInterceptor = sp.GetRequiredService<SqlitePragmaInterceptor>();
            var tenantInterceptor = sp.GetRequiredService<TenantSaveChangesInterceptor>();

            options.UseSqlite(connectionString)
                   .AddInterceptors(pragmaInterceptor, tenantInterceptor);
        });

        services.AddScoped<IAuditLogService, AuditLogService>();

        return services;
    }
}
