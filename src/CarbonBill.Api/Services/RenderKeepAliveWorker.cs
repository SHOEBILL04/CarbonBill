using System.Net.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CarbonBill.Api.Services;

/// <summary>
/// Background worker to prevent Render Free Tier web services from sleeping after 15 minutes of inactivity.
/// Render automatically injects RENDER_EXTERNAL_URL (e.g. https://carbonbill.onrender.com).
/// This worker sends a lightweight GET request to /health every 12 minutes to keep the container awake.
/// </summary>
public class RenderKeepAliveWorker(
    IConfiguration configuration,
    IHttpClientFactory httpClientFactory,
    ILogger<RenderKeepAliveWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Render sets RENDER_EXTERNAL_URL automatically (e.g., https://carbonbill.onrender.com)
        var externalUrl = configuration["RENDER_EXTERNAL_URL"]
            ?? configuration["KEEP_ALIVE_URL"]
            ?? configuration["Render:ExternalUrl"];

        var isExplicitlyEnabled = configuration.GetValue<bool>("KEEP_ALIVE_ENABLED", false);

        if (string.IsNullOrWhiteSpace(externalUrl) && !isExplicitlyEnabled)
        {
            logger.LogInformation("[KeepAlive] Render anti-sleep worker is dormant (RENDER_EXTERNAL_URL not set).");
            return;
        }

        // Render free tier sleeps after 15 minutes of inactivity. Default interval: 12 minutes.
        var intervalMinutes = configuration.GetValue<int>("KEEP_ALIVE_INTERVAL_MINUTES", 12);
        if (intervalMinutes < 1) intervalMinutes = 12;

        var targetUrl = !string.IsNullOrWhiteSpace(externalUrl)
            ? $"{externalUrl.TrimEnd('/')}/health"
            : "http://localhost:5000/health";

        logger.LogInformation(
            "[KeepAlive] Render Anti-Sleep Worker active! Target: {TargetUrl}, Interval: every {Interval} minutes.",
            targetUrl, intervalMinutes);

        // Initial delay before the first ping to let the web server finish bootstrapping
        try
        {
            await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        var client = httpClientFactory.CreateClient("KeepAliveClient");
        client.Timeout = TimeSpan.FromSeconds(30);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var response = await client.GetAsync(targetUrl, stoppingToken);
                logger.LogInformation(
                    "[KeepAlive] Heartbeat ping sent to {TargetUrl}. Status: {StatusCode} at {Time}",
                    targetUrl, (int)response.StatusCode, DateTime.UtcNow);
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                logger.LogWarning(ex, "[KeepAlive] Heartbeat ping to {TargetUrl} failed: {Message}", targetUrl, ex.Message);
            }

            try
            {
                await Task.Delay(TimeSpan.FromMinutes(intervalMinutes), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
