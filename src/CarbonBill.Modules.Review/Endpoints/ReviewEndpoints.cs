using System.Security.Claims;
using CarbonBill.Modules.Review.Services;
using CarbonBill.SharedKernel.Tenancy;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace CarbonBill.Modules.Review.Endpoints;

public static class ReviewEndpoints
{
    public static IEndpointRouteBuilder MapReviewEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1")
            .WithTags("Review")
            .RequireAuthorization();

        // GET /api/v1/review/queue
        group.MapGet("/review/queue", async (
            [FromQuery] Guid? siteId,
            [FromQuery] string? docType,
            [FromQuery] int? limit,
            IReviewService reviewService,
            CancellationToken ct) =>
        {
            var items = await reviewService.GetReviewQueueAsync(siteId, docType, limit ?? 50, ct);
            return Results.Ok(new { items, count = items.Count });
        }).AllowAnonymous();

        // PUT /api/v1/documents/{id:guid}/fields
        group.MapPut("/documents/{id:guid}/fields", async (
            Guid id,
            [FromBody] UpdateFieldsRequest request,
            IReviewService reviewService,
            ITenantContext tenantContext,
            CancellationToken ct) =>
        {
            var userId = tenantContext.CurrentUserId ?? Guid.Empty;
            var result = await reviewService.UpdateDocumentFieldsAsync(id, request, userId, ct);
            if (!result.IsSuccess)
            {
                return Results.Problem(
                    detail: result.Error,
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Field Update Failed");
            }

            return Results.Ok(new { success = true, documentId = id });
        }).AllowAnonymous();

        // POST /api/v1/documents/{id:guid}/confirm
        group.MapPost("/documents/{id:guid}/confirm", async (
            Guid id,
            [FromBody] ConfirmDocumentRequest request,
            IReviewService reviewService,
            ITenantContext tenantContext,
            CancellationToken ct) =>
        {
            var userId = tenantContext.CurrentUserId ?? Guid.Empty;

            var result = await reviewService.ConfirmDocumentAsync(id, request, userId, ct);
            if (!result.IsSuccess)
            {
                return Results.Problem(
                    detail: result.Error,
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Confirmation Failed");
            }

            return Results.Ok(new { success = true, documentId = id, status = "Calculated" });
        }).AllowAnonymous();

        // POST /api/v1/documents/bulk-confirm
        group.MapPost("/documents/bulk-confirm", async (
            [FromBody] BulkConfirmRequest request,
            IReviewService reviewService,
            ITenantContext tenantContext,
            CancellationToken ct) =>
        {
            var userId = tenantContext.CurrentUserId ?? Guid.Empty;

            var result = await reviewService.BulkConfirmAsync(request, userId, ct);
            return Results.Ok(result);
        }).AllowAnonymous();

        // GET /api/v1/review/settings
        group.MapGet("/review/settings", async (
            IReviewService reviewService,
            CancellationToken ct) =>
        {
            var res = await reviewService.GetOrUpdateOrgSettingsAsync(ct: ct);
            if (!res.IsSuccess)
            {
                return Results.Problem(detail: res.Error, statusCode: StatusCodes.Status400BadRequest);
            }
            return Results.Ok(res.Value);
        }).AllowAnonymous();

        // PUT /api/v1/review/settings
        group.MapPut("/review/settings", async (
            [FromBody] ReviewSettingsUpdateDto body,
            IReviewService reviewService,
            CancellationToken ct) =>
        {
            var res = await reviewService.GetOrUpdateOrgSettingsAsync(
                autoConfirmEnabled: body.AutoConfirmEnabled,
                threshold: body.AutoConfirmThreshold,
                samplingRate: body.SamplingRate,
                ct: ct);

            if (!res.IsSuccess)
            {
                return Results.Problem(detail: res.Error, statusCode: StatusCodes.Status400BadRequest);
            }
            return Results.Ok(res.Value);
        });

        // POST /api/v1/documents/{id:guid}/retake
        group.MapPost("/documents/{id:guid}/retake", async (
            Guid id,
            [FromBody] RetakeRequestDto? request,
            IReviewService reviewService,
            ITenantContext tenantContext,
            CancellationToken ct) =>
        {
            var userId = tenantContext.CurrentUserId ?? Guid.Empty;
            var reason = request?.Reason ?? "Blurry or unreadable document";
            var result = await reviewService.RequestRetakeAsync(id, reason, userId, ct);
            if (!result.IsSuccess)
            {
                return Results.Problem(
                    detail: result.Error,
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Retake Request Failed");
            }

            return Results.Ok(new { success = true, documentId = id, status = "ReuploadRequested" });
        }).AllowAnonymous();

        return endpoints;
    }
}

public record ReviewSettingsUpdateDto(
    bool? AutoConfirmEnabled = null,
    float? AutoConfirmThreshold = null,
    float? SamplingRate = null);

public record RetakeRequestDto(string? Reason = null);
