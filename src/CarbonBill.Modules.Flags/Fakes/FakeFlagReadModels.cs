using CarbonBill.Modules.Flags.Contracts;

namespace CarbonBill.Modules.Flags.Fakes;

public class FakeFlagDocumentReadModel : IFlagDocumentReadModel
{
    private readonly List<ExtractedDocumentRecord> _documents = [];
    private readonly Dictionary<(Guid OrgId, Guid AssetId), HistoricalAssetConsumption> _history = [];

    public void AddDocument(ExtractedDocumentRecord doc) => _documents.Add(doc);

    public void SetHistory(Guid orgId, Guid assetId, HistoricalAssetConsumption consumption) =>
        _history[(orgId, assetId)] = consumption;

    public Task<IReadOnlyList<ExtractedDocumentRecord>> GetExtractedDocumentsAsync(Guid orgId, string period, CancellationToken ct = default)
    {
        var docs = _documents
            .Where(d => d.OrgId == orgId && d.BillingPeriod.Equals(period, StringComparison.OrdinalIgnoreCase))
            .ToList();
        return Task.FromResult<IReadOnlyList<ExtractedDocumentRecord>>(docs);
    }

    public Task<HistoricalAssetConsumption?> GetHistoricalConsumptionAsync(Guid orgId, Guid assetId, CancellationToken ct = default)
    {
        _history.TryGetValue((orgId, assetId), out var history);
        return Task.FromResult(history);
    }
}

public class FakeFlagEmissionReadModel : IFlagEmissionReadModel
{
    private readonly Dictionary<(Guid OrgId, string Period), PeriodEmissionSummary> _summaries = [];

    public void SetEmissionSummary(Guid orgId, string period, PeriodEmissionSummary summary) =>
        _summaries[(orgId, period)] = summary;

    public Task<PeriodEmissionSummary?> GetPeriodEmissionSummaryAsync(Guid orgId, string period, CancellationToken ct = default)
    {
        _summaries.TryGetValue((orgId, period), out var summary);
        return Task.FromResult(summary);
    }
}
