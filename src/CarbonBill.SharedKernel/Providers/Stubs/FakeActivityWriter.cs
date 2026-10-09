using CarbonBill.SharedKernel.Contracts;
using CarbonBill.SharedKernel.Domain;
using Microsoft.Extensions.Logging;

namespace CarbonBill.SharedKernel.Providers.Stubs;

public class FakeActivityWriter(ILogger<FakeActivityWriter> logger) : IActivityWriter
{
    public Task<Result<Guid>> RecordConfirmedActivityAsync(
        ConfirmedActivityRequest request,
        CancellationToken ct = default)
    {
        logger.LogInformation(
            "FakeActivityWriter: Recorded activity for Doc {DocId}, Type: {Type}, Qty: {Qty} {Unit}, Period: {Period}, Estimated: {Estimated}",
            request.DocumentId,
            request.ActivityType,
            request.Quantity,
            request.Unit,
            request.BillingPeriod,
            request.IsEstimated);

        return Task.FromResult(Result.Success(Guid.NewGuid()));
    }
}
