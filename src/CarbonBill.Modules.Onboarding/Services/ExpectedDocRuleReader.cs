using CarbonBill.Modules.Onboarding.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CarbonBill.Modules.Onboarding.Services;

public record ExpectedDocRuleDto(
    Guid Id,
    Guid OrgId,
    Guid AssetId,
    string AssetName,
    string AssetType,
    string DocType,
    string Frequency,
    int DueDayOfMonth,
    Guid? ResponsibleUserId);

public interface IExpectedDocRuleReader
{
    Task<IReadOnlyList<ExpectedDocRuleDto>> GetRulesForOrgAsync(Guid orgId, CancellationToken ct = default);
    Task<IReadOnlyList<ExpectedDocRuleDto>> GetAllActiveRulesAsync(CancellationToken ct = default);
}

public class ExpectedDocRuleReader(OnboardingDbContext dbContext) : IExpectedDocRuleReader
{
    public async Task<IReadOnlyList<ExpectedDocRuleDto>> GetRulesForOrgAsync(Guid orgId, CancellationToken ct = default)
    {
        return await dbContext.ExpectedDocRules
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(r => r.OrgId == orgId && r.IsActive)
            .Include(r => r.Asset)
            .Select(r => new ExpectedDocRuleDto(
                r.Id,
                r.OrgId,
                r.AssetId,
                r.Asset.Name,
                r.Asset.Type,
                r.DocType,
                r.Frequency,
                r.DueDayOfMonth,
                r.ResponsibleUserId))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<ExpectedDocRuleDto>> GetAllActiveRulesAsync(CancellationToken ct = default)
    {
        return await dbContext.ExpectedDocRules
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(r => r.IsActive)
            .Include(r => r.Asset)
            .Select(r => new ExpectedDocRuleDto(
                r.Id,
                r.OrgId,
                r.AssetId,
                r.Asset.Name,
                r.Asset.Type,
                r.DocType,
                r.Frequency,
                r.DueDayOfMonth,
                r.ResponsibleUserId))
            .ToListAsync(ct);
    }
}
