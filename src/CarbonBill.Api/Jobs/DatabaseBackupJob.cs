using System.Data.Common;
using CarbonBill.SharedKernel.Providers;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CarbonBill.Api.Jobs;

public interface IDatabaseBackupJob
{
    Task ExecuteAsync(CancellationToken cancellationToken = default);
}

public class DatabaseBackupJob(
    IFileStore fileStore,
    IConfiguration configuration,
    ILogger<DatabaseBackupJob> logger) : IDatabaseBackupJob
{
    public async Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Data Source=/data/carbonbill.db;Cache=Shared";

        var builder = new SqliteConnectionStringBuilder(connectionString);
        var dbPath = builder.DataSource;

        logger.LogInformation("Starting scheduled SQLite backup using VACUUM INTO for database: {DbPath}", dbPath);

        var tempBackupPath = Path.Combine(Path.GetTempPath(), $"carbonbill_backup_{DateTime.UtcNow:yyyyMMdd_HHmmss}.db");

        try
        {
            await using (var connection = new SqliteConnection(connectionString))
            {
                await connection.OpenAsync(cancellationToken);

                // Run VACUUM INTO to create an atomic, non-blocking backup copy
                await using var command = connection.CreateCommand();
                command.CommandText = $"VACUUM INTO '{tempBackupPath.Replace("'", "''")}';";
                await command.ExecuteNonQueryAsync(cancellationToken);
            }

            logger.LogInformation("VACUUM INTO completed. Uploading backup copy to object storage via IFileStore...");

            await using (var fileStream = File.OpenRead(tempBackupPath))
            {
                var destinationPath = $"backups/carbonbill_{DateTime.UtcNow:yyyyMMdd_HHmmss}.db";
                await fileStore.UploadAsync(
                    contentStream: fileStream,
                    destinationPath: destinationPath,
                    contentType: "application/x-sqlite3",
                    metadata: new Dictionary<string, string>
                    {
                        ["source_db"] = Path.GetFileName(dbPath),
                        ["backup_timestamp"] = DateTime.UtcNow.ToString("O")
                    },
                    cancellationToken: cancellationToken);

                logger.LogInformation("Backup uploaded successfully to object storage at {DestinationPath}", destinationPath);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Database backup job failed.");
            throw;
        }
        finally
        {
            if (File.Exists(tempBackupPath))
            {
                try
                {
                    File.Delete(tempBackupPath);
                }
                catch (Exception cleanupEx)
                {
                    logger.LogWarning(cleanupEx, "Failed to clean up temporary backup file: {TempPath}", tempBackupPath);
                }
            }
        }
    }
}
