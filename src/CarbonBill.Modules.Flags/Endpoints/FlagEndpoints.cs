using CarbonBill.Modules.Flags.Domain;
using CarbonBill.Modules.Flags.Persistence;
using CarbonBill.Modules.Flags.Services;
using CarbonBill.SharedKernel.Contracts;
using CarbonBill.SharedKernel.Tenancy;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CarbonBill.Modules.Flags.Endpoints;

public record DismissFlagRequest(string Reason);

public record UpdateFlagRuleRequest(
    string? TriggerParametersJson,
    string? DefaultSeverity,
    bool? IsActive);

public record SnoozeFlagRequest(int Days, string? Reason);

public static class FlagEndpoints
{
    private static readonly Guid DefaultDemoOrgId = Guid.Parse("647EF6AD-9C63-42CC-ABB1-9EDF7E9E27D3");

    public static IEndpointRouteBuilder MapFlagEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/flags")
            .WithTags("Flags");

        // GET /api/v1/flags?state=open&period=2026-09
        group.MapGet("/", async (
            string? state,
            string? period,
            string? severity,
            int? page,
            int? pageSize,
            IFlagReader flagReader,
            ITenantContext tenantContext,
            CancellationToken ct) =>
        {
            var orgId = tenantContext.CurrentOrgId ?? DefaultDemoOrgId;

            var p = Math.Max(1, page ?? 1);
            var size = Math.Clamp(pageSize ?? 50, 1, 100);

            var flags = await flagReader.GetFlagsAsync(
                orgId: orgId,
                period: period,
                state: state,
                severity: severity,
                page: p,
                pageSize: size,
                ct: ct);

            return Results.Ok(flags);
        }).AllowAnonymous();

        // GET /api/v1/flags/top5 (Dashboard Query: Top 5 by severity then recency)
        group.MapGet("/top5", async (
            IFlagReader flagReader,
            ITenantContext tenantContext,
            CancellationToken ct) =>
        {
            var orgId = tenantContext.CurrentOrgId ?? DefaultDemoOrgId;

            var top5 = await flagReader.GetDashboardTop5FlagsAsync(orgId, ct);
            return Results.Ok(top5);
        }).AllowAnonymous();

        // POST /api/v1/flags/{id}/acknowledge
        group.MapPost("/{id:guid}/acknowledge", async (
            Guid id,
            FlagsService flagsService,
            ITenantContext tenantContext,
            CancellationToken ct) =>
        {
            var orgId = tenantContext.CurrentOrgId ?? DefaultDemoOrgId;
            var success = await flagsService.AcknowledgeFlagAsync(id, orgId, ct);
            return success ? Results.Ok() : Results.NotFound();
        }).AllowAnonymous();

        // POST /api/v1/flags/{id}/dismiss
        group.MapPost("/{id:guid}/dismiss", async (
            Guid id,
            DismissFlagRequest request,
            FlagsService flagsService,
            ITenantContext tenantContext,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Reason))
            {
                return Results.Problem("A mandatory non-empty justification reason is required to dismiss a flag.", statusCode: StatusCodes.Status400BadRequest);
            }

            var orgId = tenantContext.CurrentOrgId ?? DefaultDemoOrgId;
            var success = await flagsService.DismissFlagAsync(id, orgId, request.Reason, ct);
            return success ? Results.Ok(new { message = "Flag dismissed for 30 days." }) : Results.NotFound();
        }).AllowAnonymous();

        // POST /api/v1/flags/{id}/snooze
        group.MapPost("/{id:guid}/snooze", async (
            Guid id,
            SnoozeFlagRequest request,
            FlagsService flagsService,
            ITenantContext tenantContext,
            CancellationToken ct) =>
        {
            var orgId = tenantContext.CurrentOrgId ?? DefaultDemoOrgId;
            var days = request.Days > 0 ? request.Days : 7;
            var reason = string.IsNullOrWhiteSpace(request.Reason) ? $"Snoozed for {days} days" : request.Reason;
            var success = await flagsService.DismissFlagAsync(id, orgId, reason, ct);
            return success ? Results.Ok(new { message = $"Flag snoozed for {days} days." }) : Results.NotFound();
        }).AllowAnonymous();

        // POST /api/v1/flags/evaluate
        group.MapPost("/evaluate", async (
            [FromQuery] string? period,
            IFlagEngine flagEngine,
            ITenantContext tenantContext,
            CancellationToken ct) =>
        {
            var orgId = tenantContext.CurrentOrgId ?? DefaultDemoOrgId;
            var evalPeriod = string.IsNullOrWhiteSpace(period) ? "2026-09" : period;

            var raised = await flagEngine.EvaluateOrgPeriodAsync(orgId, evalPeriod, null, ct);
            return Results.Ok(new { evaluatedPeriod = evalPeriod, raisedCount = raised.Count, flags = raised });
        }).AllowAnonymous();

        // GET /api/v1/flags/rules (Platform Admin inspects tunable rules)
        group.MapGet("/rules", async (
            FlagsDbContext dbContext,
            CancellationToken ct) =>
        {
            var rules = await dbContext.FlagRules.ToListAsync(ct);
            return Results.Ok(rules);
        });

        // PUT /api/v1/flags/rules/{code} (Platform Admin updates parameters without deployment)
        group.MapPut("/rules/{code}", async (
            string code,
            UpdateFlagRuleRequest request,
            FlagsDbContext dbContext,
            ITenantContext tenantContext,
            CancellationToken ct) =>
        {
            if (!tenantContext.IsAuthenticated)
            {
                return Results.Unauthorized();
            }

            var rule = await dbContext.FlagRules.FirstOrDefaultAsync(r => r.FlagCode == code, ct);
            if (rule == null)
            {
                return Results.NotFound();
            }

            if (request.TriggerParametersJson != null)
                rule.TriggerParametersJson = request.TriggerParametersJson;

            if (!string.IsNullOrWhiteSpace(request.DefaultSeverity))
                rule.DefaultSeverity = request.DefaultSeverity;

            if (request.IsActive.HasValue)
                rule.IsActive = request.IsActive.Value;

            rule.UpdatedAtUtc = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(ct);

            return Results.Ok(rule);
        });

        return endpoints;
    }
}
