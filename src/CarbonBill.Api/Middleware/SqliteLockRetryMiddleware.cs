using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;
using Polly;
using Polly.Retry;

namespace CarbonBill.Api.Middleware;

public class SqliteLockRetryMiddleware(
    RequestDelegate next,
    ILogger<SqliteLockRetryMiddleware> logger)
{
    private static readonly ResiliencePipeline Pipeline = new ResiliencePipelineBuilder()
        .AddRetry(new RetryStrategyOptions
        {
            ShouldHandle = new PredicateBuilder().Handle<SqliteException>(ex => ex.SqliteErrorCode == 5), // SQLITE_BUSY
            MaxRetryAttempts = 3,
            Delay = TimeSpan.FromMilliseconds(100),
            BackoffType = DelayBackoffType.Exponential,
            UseJitter = true
        })
        .Build();

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await Pipeline.ExecuteAsync(async _ =>
            {
                await next(context);
            });
        }
        catch (SqliteException ex) when (ex.SqliteErrorCode == 5)
        {
            logger.LogError(ex, "SQLite database locked after multiple retry attempts.");
            context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsJsonAsync(new
            {
                type = "https://tools.ietf.org/html/rfc7807",
                title = "Database Busy",
                status = StatusCodes.Status503ServiceUnavailable,
                detail = "The database is currently processing high write volume. Please retry your request momentarily."
            });
        }
    }
}
