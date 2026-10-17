# ==============================================================================
# Unified Production Multi-Stage Dockerfile for CarbonBill
# Builds: React / Vite PWA Frontend + ASP.NET Core 8 Web API + Tesseract OCR
# Perfect for 1-Click Render.com / Cloud Web Service Deployment
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend (Node.js 20 Alpine)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-build
WORKDIR /app/web

# Install frontend dependencies
COPY web/package.json web/package-lock.json* ./
RUN npm ci

# Copy frontend source and build production bundle
COPY web/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Build .NET 8 Backend
# ------------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /src

# Copy Directory.Build.props and solution file
COPY Directory.Build.props ./
COPY CarbonBill.sln ./

# Copy all project csproj files for layer caching
COPY src/CarbonBill.SharedKernel/CarbonBill.SharedKernel.csproj src/CarbonBill.SharedKernel/
COPY src/CarbonBill.Modules.IdentityTenancy/CarbonBill.Modules.IdentityTenancy.csproj src/CarbonBill.Modules.IdentityTenancy/
COPY src/CarbonBill.Modules.Audit/CarbonBill.Modules.Audit.csproj src/CarbonBill.Modules.Audit/
COPY src/CarbonBill.Modules.Onboarding/CarbonBill.Modules.Onboarding.csproj src/CarbonBill.Modules.Onboarding/
COPY src/CarbonBill.Modules.Documents/CarbonBill.Modules.Documents.csproj src/CarbonBill.Modules.Documents/
COPY src/CarbonBill.Modules.Extraction/CarbonBill.Modules.Extraction.csproj src/CarbonBill.Modules.Extraction/
COPY src/CarbonBill.Modules.Review/CarbonBill.Modules.Review.csproj src/CarbonBill.Modules.Review/
COPY src/CarbonBill.Modules.ActivityUnits/CarbonBill.Modules.ActivityUnits.csproj src/CarbonBill.Modules.ActivityUnits/
COPY src/CarbonBill.Modules.FactorRegistry/CarbonBill.Modules.FactorRegistry.csproj src/CarbonBill.Modules.FactorRegistry/
COPY src/CarbonBill.Modules.Calculation/CarbonBill.Modules.Calculation.csproj src/CarbonBill.Modules.Calculation/
COPY src/CarbonBill.Modules.GapDetection/CarbonBill.Modules.GapDetection.csproj src/CarbonBill.Modules.GapDetection/
COPY src/CarbonBill.Modules.Flags/CarbonBill.Modules.Flags.csproj src/CarbonBill.Modules.Flags/
COPY src/CarbonBill.Modules.Recommendations/CarbonBill.Modules.Recommendations.csproj src/CarbonBill.Modules.Recommendations/
COPY src/CarbonBill.Modules.Reporting/CarbonBill.Modules.Reporting.csproj src/CarbonBill.Modules.Reporting/
COPY src/CarbonBill.Modules.Notifications/CarbonBill.Modules.Notifications.csproj src/CarbonBill.Modules.Notifications/
COPY src/CarbonBill.Modules.PlatformAdmin/CarbonBill.Modules.PlatformAdmin.csproj src/CarbonBill.Modules.PlatformAdmin/
COPY src/CarbonBill.Modules.Insights/CarbonBill.Modules.Insights.csproj src/CarbonBill.Modules.Insights/
COPY src/CarbonBill.Api/CarbonBill.Api.csproj src/CarbonBill.Api/

# Restore dependencies
RUN dotnet restore src/CarbonBill.Api/CarbonBill.Api.csproj

# Copy all source files and publish
COPY src/ src/
RUN dotnet publish src/CarbonBill.Api/CarbonBill.Api.csproj -c Release -o /app/publish --no-restore

# ------------------------------------------------------------------------------
# Stage 3: Runtime Container (ASP.NET Core 8 with Tesseract OCR & Bengali Data)
# ------------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install native dependencies: Tesseract OCR (ben + eng), SQLite3, and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-ben \
    libgdiplus \
    sqlite3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create persistent storage folder for SQLite and file uploads (mountable via Railway/Docker volumes)
RUN mkdir -p /data && chmod 777 /data

# Copy published .NET 8 application
COPY --from=backend-build /app/publish .

# Copy compiled frontend SPA bundle into wwwroot for static serving
COPY --from=frontend-build /app/web/dist ./wwwroot

# Copy seeds data directory
COPY seeds/ ./seeds/

# Environment Configuration
ENV ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true \
    ConnectionStrings__DefaultConnection="Data Source=/data/carbonbill.db;Cache=Shared" \
    ConnectionStrings__HangfireConnection="/data/hangfire.db" \
    OCR_PROVIDER=Tesseract \
    KEEP_ALIVE_INTERVAL_MINUTES=12

# Default ports (ASP.NET Core auto-binds to $PORT on Render and Railway)
EXPOSE 5000 8080 10000

ENTRYPOINT ["dotnet", "CarbonBill.Api.dll"]
