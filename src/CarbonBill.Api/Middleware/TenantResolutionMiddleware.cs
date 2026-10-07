using System.Security.Claims;
using CarbonBill.SharedKernel.Tenancy;
using Microsoft.AspNetCore.Http;
using Serilog.Context;

namespace CarbonBill.Api.Middleware;

public class TenantResolutionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext)
    {
        var user = context.User;
        if (user.Identity?.IsAuthenticated == true)
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier) ?? user.FindFirst("sub");
            var orgIdClaim = user.FindFirst("org_id");
            var roleClaim = user.FindFirst(ClaimTypes.Role) ?? user.FindFirst("role");
            var isAdminClaim = user.FindFirst("is_platform_admin");

            var hasUserId = Guid.TryParse(userIdClaim?.Value, out var userId);
            
            // Allow tenant switching header for multi-org consultants or platform admins
            Guid orgId = Guid.Empty;
            if (context.Request.Headers.TryGetValue("X-Org-Id", out var customOrgId) &&
                Guid.TryParse(customOrgId, out var parsedOrgId))
            {
                orgId = parsedOrgId;
            }
            else if (Guid.TryParse(orgIdClaim?.Value, out var tokenOrgId))
            {
                orgId = tokenOrgId;
            }

            var role = roleClaim?.Value;
            var isPlatformAdmin = string.Equals(isAdminClaim?.Value, "true", StringComparison.OrdinalIgnoreCase);

            if (hasUserId && orgId != Guid.Empty)
            {
                tenantContext.SetContext(orgId, userId, role, isPlatformAdmin);
            }
        }

        // Enrich Serilog context with current tenant and user IDs
        using (LogContext.PushProperty("TenantId", tenantContext.CurrentOrgId?.ToString() ?? "Anonymous"))
        using (LogContext.PushProperty("UserId", tenantContext.CurrentUserId?.ToString() ?? "Anonymous"))
        {
            await next(context);
        }
    }
}
