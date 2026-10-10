using CarbonBill.SharedKernel.Events;

namespace CarbonBill.Modules.Notifications.Services;

public record RenderedNotification(string Title, string Body, string? ActionUrl = null);

public record WeeklyDigestItem(
    string Title,
    string Details,
    string Severity, // "Red", "Amber", "Info"
    DateTime OccurredAtUtc,
    string? Url = null);

public record WeeklyDigestModel(
    string OrganizationName,
    string Period,
    IReadOnlyList<WeeklyDigestItem> Top5Items,
    int TotalActiveAlertsCount);

public record RenderedDigest(string Subject, string HtmlBody, string PlainTextBody);

public interface INotificationTemplateRenderer
{
    RenderedNotification RenderMissingAlert(MissingAlertRaisedEvent alert, string language = "bn");
    RenderedNotification RenderFlagRaised(FlagRaisedEvent flag, string language = "bn");
    RenderedNotification RenderDocumentRetake(DocumentRetakeRequestedEvent retake, string language = "bn");
    RenderedNotification RenderDocumentFailed(DocumentFailedEvent failed, string language = "bn");
    RenderedDigest RenderWeeklyDigest(WeeklyDigestModel model, string language = "bn");
    string FormatNumber(long number, string language = "bn");
}
