using CarbonBill.Modules.IdentityTenancy.Persistence;
using CarbonBill.Modules.IdentityTenancy.Services;
using CarbonBill.SharedKernel.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CarbonBill.Modules.IdentityTenancy;

public static class IdentityTenancyModuleExtensions
{
    public static IServiceCollection AddIdentityTenancyModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Data Source=/data/carbonbill.db;Cache=Shared";

        services.AddScoped<SqlitePragmaInterceptor>();
        services.AddScoped<TenantSaveChangesInterceptor>();

        services.AddDbContext<IdentityTenancyDbContext>((sp, options) =>
        {
            var pragmaInterceptor = sp.GetRequiredService<SqlitePragmaInterceptor>();
            var tenantInterceptor = sp.GetRequiredService<TenantSaveChangesInterceptor>();

            options.UseSqlite(connectionString)
                   .AddInterceptors(pragmaInterceptor, tenantInterceptor);
        });

        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IInvitationService, InvitationService>();

        return services;
    }
}
