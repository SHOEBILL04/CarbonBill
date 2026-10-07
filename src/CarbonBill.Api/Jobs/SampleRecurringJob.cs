using Microsoft.Extensions.Logging;

namespace CarbonBill.Api.Jobs;

public interface ISampleRecurringJob
{
    Task ExecuteAsync(CancellationToken cancellationToken = default);
}

public class SampleRecurringJob(ILogger<SampleRecurringJob> logger) : ISampleRecurringJob
{
    public Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        logger.LogInformation("[Hangfire Recurring Job] Nightly gap detection & flag evaluation heartbeat executed at {UtcTime}", DateTime.UtcNow);
        return Task.CompletedTask;
    }
}
