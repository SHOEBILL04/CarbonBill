using System.Globalization;
using System.Text;
using System.Threading.RateLimiting;
using CarbonBill.Api;
using CarbonBill.Api.Hangfire;
using CarbonBill.Api.Jobs;
using CarbonBill.Api.Middleware;
using CarbonBill.Modules.ActivityUnits;
using CarbonBill.Modules.Audit;
using CarbonBill.Modules.Calculation;
using CarbonBill.Modules.Documents;
using CarbonBill.Modules.Extraction;
using CarbonBill.Modules.FactorRegistry;
using CarbonBill.Modules.Flags;
using CarbonBill.Modules.Flags.Jobs;
using CarbonBill.Modules.GapDetection;
using CarbonBill.Modules.GapDetection.Jobs;
using CarbonBill.Modules.IdentityTenancy;
using CarbonBill.Modules.IdentityTenancy.Endpoints;
using CarbonBill.Modules.Insights;
using CarbonBill.Modules.Notifications;
using CarbonBill.Modules.Notifications.Jobs;
using CarbonBill.Modules.Onboarding;
using CarbonBill.Modules.PlatformAdmin;
using CarbonBill.Modules.Recommendations;
using CarbonBill.Modules.Reporting;
using CarbonBill.Modules.Review;
using CarbonBill.SharedKernel.Events;
using CarbonBill.SharedKernel.Providers;
using CarbonBill.SharedKernel.Providers.Stubs;
using CarbonBill.SharedKernel.Tenancy;
using Hangfire;
using Hangfire.Storage.SQLite;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

// Load .env if present in current directory or parents
LoadDotEnv();

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);
builder.Configuration.AddEnvironmentVariables();

// Render and Cloud Port Binding (Render dynamically sets PORT)
var cloudPort = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(cloudPort))
{
    builder.WebHost.UseUrls($"http://+:{cloudPort}");
}

// Configure Serilog
builder.Host.UseSerilog((ctx, lc) =>
{
    lc.ReadFrom.Configuration(ctx.Configuration)
      .Enrich.FromLogContext()
      .WriteTo.Console(
          outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{TenantId}] {Message:lj}{NewLine}{Exception}",
          formatProvider: CultureInfo.InvariantCulture);
});

// Tenancy & Domain Events
builder.Services.AddScoped<ITenantContext, TenantContext>();
builder.Services.AddScoped<IDomainEventPublisher, InMemoryDomainEventPublisher>();

// Provider Configuration (UseFakes=false uses real module implementations by default)
var useFakes = builder.Configuration.GetValue<bool>("UseFakes", false);

if (useFakes)
{
    builder.Services.AddSingleton<IOcrProvider, FakeTesseractOcrProvider>();
    builder.Services.AddSingleton<IFileStore, LocalOrR2FileStoreStub>();
    builder.Services.AddSingleton<INotifier, LoggingNotifierStub>();
    builder.Services.AddSingleton<IReportRenderer, FakeQuestPdfReportRenderer>();
}
else
{
    builder.Services.AddSingleton<IOcrProvider, FakeTesseractOcrProvider>();
    builder.Services.AddSingleton<IFileStore, LocalOrR2FileStoreStub>();
    // Real INotifier and IReportRenderer are registered by AddNotificationsModule and AddReportingModule
}

// Ensure SQLite target directories exist before registering contexts
var defaultConn = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Data Source=carbonbill.db;Cache=Shared";
EnsureSqliteDirectoryExists(defaultConn);

// Register Domain Modules
builder.Services.AddIdentityTenancyModule(builder.Configuration);
builder.Services.AddAuditModule(builder.Configuration);
builder.Services.AddOnboardingModule(builder.Configuration);
builder.Services.AddDocumentsModule(builder.Configuration);
builder.Services.AddExtractionModule(builder.Configuration);
builder.Services.AddReviewModule(builder.Configuration);
builder.Services.AddActivityUnitsModule(builder.Configuration);
builder.Services.AddFactorRegistryModule(builder.Configuration);
builder.Services.AddCalculationModule(builder.Configuration);
builder.Services.AddGapDetectionModule(builder.Configuration);
builder.Services.AddFlagsModule(builder.Configuration);
builder.Services.AddRecommendationsModule(builder.Configuration);
builder.Services.AddReportingModule(builder.Configuration);
builder.Services.AddNotificationsModule(builder.Configuration);
builder.Services.AddPlatformAdminModule(builder.Configuration);
builder.Services.AddInsightsModule(builder.Configuration);

// Background Jobs (Hangfire + SQLite)
var rawHangfireConn = builder.Configuration.GetConnectionString("HangfireConnection")
    ?? "hangfire.db";
var hangfireDbPath = ResolveHangfireDbPath(rawHangfireConn);

builder.Services.AddHangfire(config =>
{
    config.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
          .UseSimpleAssemblyNameTypeSerializer()
          .UseRecommendedSerializerSettings()
          .UseSQLiteStorage(hangfireDbPath, new SQLiteStorageOptions
          {
              QueuePollInterval = TimeSpan.FromSeconds(5)
          });
});
builder.Services.AddHangfireServer();

builder.Services.AddScoped<IDatabaseBackupJob, DatabaseBackupJob>();
builder.Services.AddScoped<ISampleRecurringJob, SampleRecurringJob>();

// JWT Authentication
var configuredSecret = builder.Configuration["Jwt:Secret"]
    ?? builder.Configuration["JWT_SECRET"]
    ?? builder.Configuration["JWT__SECRET"];

var jwtKey = !string.IsNullOrWhiteSpace(configuredSecret)
    ? configuredSecret
    : builder.Configuration["Jwt:Key"]
      ?? "CarbonBill-SuperSecret-Development-Key-2026-VeryLongKeyNeeded-AtLeast32Bytes";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "CarbonBill";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "CarbonBillClients";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();

// Built-in Rate Limiter
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var partitionKey = httpContext.User.Identity?.IsAuthenticated == true
            ? httpContext.User.FindFirst("sub")?.Value ?? "auth_user"
            : httpContext.Connection.RemoteIpAddress?.ToString() ?? "anon_ip";

        return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 100,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 10,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst
        });
    });
});

// Problem Details & Health Checks
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks();

// Render Anti-Sleep Keep-Alive Background Service
builder.Services.AddHttpClient("KeepAliveClient");
builder.Services.AddHostedService<CarbonBill.Api.Services.RenderKeepAliveWorker>();

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "CarbonBill API",
        Version = "v1",
        Description = "SME Carbon-Accounting Platform API (ASP.NET Core LTS & SQLite)"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// CORS (PWA origin support)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Execute CLI seed command if --seed argument is passed
if (args.Contains("--seed"))
{
    Log.Information("CarbonBill CLI --seed flag detected. Loading versioned platform datasets...");
    await DataSeeder.SeedDevelopmentDataAsync(app.Services);
    Log.Information("Versioned platform datasets successfully loaded. Exiting process.");
    return;
}

// Ensure database tables and initial datasets exist on container startup (Production & Development)
await DataSeeder.SeedDevelopmentDataAsync(app.Services);

// Middleware Pipeline
app.UseExceptionHandler();
app.UseStatusCodePages();

app.UseMiddleware<SqliteLockRetryMiddleware>();

app.UseCors();
app.UseRateLimiter();

app.UseAuthentication();
app.UseMiddleware<TenantResolutionMiddleware>();
app.UseAuthorization();

if (app.Environment.IsDevelopment() || app.Environment.IsStaging())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "CarbonBill API v1");
        c.RoutePrefix = "swagger";
    });
}

// Hangfire Dashboard (Admin Only)
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = [new HangfireAdminDashboardFilter()],
    DashboardTitle = "CarbonBill Background Jobs"
});

// Schedule Recurring Jobs
using (var scope = app.Services.CreateScope())
{
    var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
    
    // Nightly SQLite atomic backup to R2
    recurringJobManager.AddOrUpdate<IDatabaseBackupJob>(
        "nightly-sqlite-vacuum-backup",
        job => job.ExecuteAsync(CancellationToken.None),
        Cron.Daily(2)); // 02:00 AM UTC

    // Nightly gap detection alert evaluation
    recurringJobManager.AddOrUpdate<INightlyGapDetectionJob>(
        "gap-detection-nightly",
        job => job.ExecuteAsync(CancellationToken.None),
        Cron.Daily());

    // Weekly consolidated notifications digest (Mondays 08:00 UTC)
    recurringJobManager.AddOrUpdate<IWeeklyDigestJob>(
        "notifications-weekly-digest",
        job => job.ExecuteAsync(CancellationToken.None),
        Cron.Weekly(DayOfWeek.Monday, 8));

    // Nightly carbon flags evaluation and dismissal expiration
    recurringJobManager.AddOrUpdate<INightlyFlagEvaluationJob>(
        "flags-evaluation-nightly",
        job => job.ExecuteAsync(CancellationToken.None),
        Cron.Daily(3)); // 03:00 AM UTC
}

// Health checks
app.MapHealthChecks("/healthz");
app.MapHealthChecks("/health");

// Serve compiled frontend SPA if wwwroot/index.html is present
var webRoot = builder.Environment.WebRootPath ?? Path.Combine(AppContext.BaseDirectory, "wwwroot");
var hasSpaIndex = File.Exists(Path.Combine(webRoot, "index.html"));

if (hasSpaIndex)
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}
else
{
    // Standalone API root endpoint (when running backend without frontend bundle)
    app.MapGet("/", () => Results.Ok(new
    {
        service = "CarbonBill.Api",
        version = "1.0.0",
        status = "healthy",
        docs = "/swagger",
        jobs = "/hangfire",
        health = "/healthz"
    }));
}

// Map Module Minimal APIs
app.MapAuthEndpoints();
app.MapOnboardingModuleEndpoints();
app.MapActivityUnitsModuleEndpoints();
app.MapFactorRegistryModuleEndpoints();
app.MapCalculationModuleEndpoints();
app.MapDocumentsModuleEndpoints();
app.MapExtractionModuleEndpoints();
app.MapReviewModuleEndpoints();
app.MapPlatformAdminModuleEndpoints();
app.MapGapDetectionModuleEndpoints();
app.MapNotificationsModuleEndpoints();
app.MapFlagsModuleEndpoints();
app.MapInsightsModuleEndpoints();
app.MapRecommendationsModuleEndpoints();
app.MapReportingModuleEndpoints();

if (hasSpaIndex)
{
    app.MapFallbackToFile("index.html");
}

app.Run();

static void LoadDotEnv()
{
    var dir = Directory.GetCurrentDirectory();
    while (!string.IsNullOrEmpty(dir))
    {
        var envFile = Path.Combine(dir, ".env");
        if (File.Exists(envFile))
        {
            foreach (var line in File.ReadAllLines(envFile))
            {
                var trimmed = line.Trim();
                if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith('#')) continue;
                var eqIdx = trimmed.IndexOf('=');
                if (eqIdx > 0)
                {
                    var k = trimmed[..eqIdx].Trim();
                    var v = trimmed[(eqIdx + 1)..].Trim();
                    if (!string.IsNullOrEmpty(k) && string.IsNullOrEmpty(Environment.GetEnvironmentVariable(k)))
                    {
                        Environment.SetEnvironmentVariable(k, v);
                    }
                }
            }
            break;
        }
        var parent = Directory.GetParent(dir);
        dir = parent?.FullName;
    }
}

static string ResolveHangfireDbPath(string? raw)
{
    var path = "hangfire.db";
    if (!string.IsNullOrWhiteSpace(raw))
    {
        var cleaned = raw.Trim();
        // If it contains "Data Source=" or "DataSource=", extract the actual file path
        if (cleaned.Contains('='))
        {
            var parts = cleaned.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var part in parts)
            {
                var kv = part.Split('=', 2, StringSplitOptions.TrimEntries);
                if (kv.Length == 2 && (kv[0].Equals("Data Source", StringComparison.OrdinalIgnoreCase) || kv[0].Equals("DataSource", StringComparison.OrdinalIgnoreCase)))
                {
                    cleaned = kv[1];
                    break;
                }
            }
        }

        if (!string.IsNullOrWhiteSpace(cleaned))
        {
            path = cleaned;
        }
    }

    try
    {
        var dir = Path.GetDirectoryName(path);
        if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
        {
            Directory.CreateDirectory(dir);
        }
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Failed to create directory for Hangfire DB path '{Path}'. Falling back to local 'hangfire.db'", path);
        path = "hangfire.db";
    }

    return path;
}

static void EnsureSqliteDirectoryExists(string? connectionString)
{
    if (string.IsNullOrWhiteSpace(connectionString)) return;

    try
    {
        var parts = connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        string? dbPath = null;
        foreach (var part in parts)
        {
            var kv = part.Split('=', 2, StringSplitOptions.TrimEntries);
            if (kv.Length == 2 && (kv[0].Equals("Data Source", StringComparison.OrdinalIgnoreCase) || kv[0].Equals("DataSource", StringComparison.OrdinalIgnoreCase)))
            {
                dbPath = kv[1];
                break;
            }
        }

        if (!string.IsNullOrWhiteSpace(dbPath))
        {
            var dir = Path.GetDirectoryName(dbPath);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }
        }
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Failed to ensure SQLite directory exists for connection string: {Conn}", connectionString);
    }
}
