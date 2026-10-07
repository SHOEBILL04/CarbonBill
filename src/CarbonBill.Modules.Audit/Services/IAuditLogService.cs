using System.Text.Json;
using CarbonBill.Modules.Audit.Domain;
using CarbonBill.Modules.Audit.Persistence;
using CarbonBill.SharedKernel.Persistence;
using CarbonBill.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CarbonBill.Modules.Audit.Services;

public record AuditLogEntry(
    Guid OrgId,
    string Action,
    string EntityType,
    string? EntityId = null,
    Guid? UserId = null,
    string? UserEmail = null,
    object? Details = null,
    string? IpAddress = null,
    string? UserAgent = null);

public interface IAuditLogService
{
    Task LogAsync(AuditLogEntry entry, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AuditLog>> GetLogsAsync(int page = 1, int pageSize = 50, CancellationToken cancellationToken = default);
}

public class AuditLogService(
    AuditDbContext dbContext,
    ITenantContext tenantContext,
    ILogger<AuditLogService> logger) : IAuditLogService
{
    public async Task LogAsync(AuditLogEntry entry, CancellationToken cancellationToken = default)
    {
        try
        {
            var orgId = entry.OrgId != Guid.Empty ? entry.OrgId : (tenantContext.CurrentOrgId ?? Guid.Empty);
            var userId = entry.UserId ?? tenantContext.CurrentUserId;

            var log = new AuditLog
            {
                OrgId = orgId,
                UserId = userId,
                UserEmail = entry.UserEmail,
                Action = entry.Action,
                EntityType = entry.EntityType,
                EntityId = entry.EntityId,
                DetailsJson = entry.Details != null ? JsonSerializer.Serialize(entry.Details) : null,
                IpAddress = entry.IpAddress,
                UserAgent = entry.UserAgent,
                OccurredAtUtc = DateTime.UtcNow
            };

            dbContext.AuditLogs.Add(log);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to write audit log entry for action {Action}", entry.Action);
            // Append-only audit shouldn't crash main operation if not critical, but is logged
        }
    }

    public async Task<IReadOnlyList<AuditLog>> GetLogsAsync(int page = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        return await dbContext.AuditLogs
            .OrderByDescending(l => l.OccurredAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }
}
