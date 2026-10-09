using CarbonBill.SharedKernel.Domain;

namespace CarbonBill.SharedKernel.Contracts;

public record ConfirmedActivityRequest(
    Guid OrgId,
    Guid? SiteId,
    Guid? AssetId,
    Guid DocumentId,
    string ActivityType,
    decimal Quantity,
    string Unit,
    decimal? TotalCostBdt,
    string BillingPeriod,
    bool IsEstimated);

public interface IActivityWriter
{
    Task<Result<Guid>> RecordConfirmedActivityAsync(
        ConfirmedActivityRequest request,
        CancellationToken ct = default);
}
