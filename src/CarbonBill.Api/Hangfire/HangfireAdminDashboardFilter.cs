using System.Security.Claims;
using CarbonBill.Modules.IdentityTenancy.Domain;
using Hangfire.Dashboard;

namespace CarbonBill.Api.Hangfire;

public class HangfireAdminDashboardFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();

        // Allow all in local Development mode for convenience
        var env = httpContext.RequestServices.GetService<IWebHostEnvironment>();
        if (env?.IsDevelopment() == true)
        {
            return true;
        }

        var user = httpContext.User;
        if (user.Identity?.IsAuthenticated != true)
        {
            return false;
        }

        var isPlatformAdmin = user.FindFirst("is_platform_admin")?.Value == "true" ||
                              user.IsInRole(Roles.PlatformAdmin);

        return isPlatformAdmin;
    }
}
