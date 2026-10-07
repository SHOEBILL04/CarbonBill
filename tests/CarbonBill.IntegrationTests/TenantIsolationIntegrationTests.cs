using CarbonBill.Modules.Audit.Domain;
using CarbonBill.Modules.Audit.Persistence;
using CarbonBill.Modules.IdentityTenancy.Domain;
using CarbonBill.Modules.IdentityTenancy.Persistence;
using CarbonBill.SharedKernel.Persistence;
using CarbonBill.SharedKernel.Tenancy;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Xunit;

namespace CarbonBill.IntegrationTests;

public class TenantIsolationIntegrationTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly TenantContext _tenantContext;
    private readonly SqlitePragmaInterceptor _pragmaInterceptor;
    private readonly TenantSaveChangesInterceptor _tenantInterceptor;
    private readonly DbContextOptions<IdentityTenancyDbContext> _identityDbOptions;
    private readonly DbContextOptions<AuditDbContext> _auditDbOptions;

    public TenantIsolationIntegrationTests()
    {
        _connection = new SqliteConnection("Data Source=:memory:;Foreign Keys=True");
        _connection.Open();

        _tenantContext = new TenantContext();
        _pragmaInterceptor = new SqlitePragmaInterceptor();
        _tenantInterceptor = new TenantSaveChangesInterceptor(_tenantContext);

        _identityDbOptions = new DbContextOptionsBuilder<IdentityTenancyDbContext>()
            .UseSqlite(_connection)
            .AddInterceptors(_pragmaInterceptor, _tenantInterceptor)
            .Options;

        _auditDbOptions = new DbContextOptionsBuilder<AuditDbContext>()
            .UseSqlite(_connection)
            .AddInterceptors(_pragmaInterceptor, _tenantInterceptor)
            .Options;

        // Create tables for all contexts using their database creators
        using var identityDb = new IdentityTenancyDbContext(_identityDbOptions, _tenantContext);
        var identityCreator = identityDb.GetService<IRelationalDatabaseCreator>();
        identityCreator.CreateTables();

        using var auditDb = new AuditDbContext(_auditDbOptions, _tenantContext);
        var auditCreator = auditDb.GetService<IRelationalDatabaseCreator>();
        auditCreator.CreateTables();
    }

    [Fact]
    public async Task ReadIsolation_OrgB_CannotRead_OrgA_Data()
    {
        var orgAId = Guid.NewGuid();
        var orgBId = Guid.NewGuid();
        var userAId = Guid.NewGuid();

        // 1. Act as Org A: Seed Organization and Invitation
        _tenantContext.SetContext(orgAId, userAId, Roles.Owner);
        using (var dbA = new IdentityTenancyDbContext(_identityDbOptions, _tenantContext))
        {
            var orgA = new Organization { Id = orgAId, Name = "Org A Textiles", Slug = "org-a", Sector = "RMG" };
            var orgB = new Organization { Id = orgBId, Name = "Org B RMG", Slug = "org-b", Sector = "RMG" };
            dbA.Organizations.AddRange(orgA, orgB);

            var invA = new Invitation
            {
                OrgId = orgAId,
                Role = Roles.FloorStaff,
                Token = "token-org-a",
                PinHash = "hash123",
                ExpiresAtUtc = DateTime.UtcNow.AddDays(7),
                CreatedByUserId = userAId
            };
            dbA.Invitations.Add(invA);
            await dbA.SaveChangesAsync();
        }

        // 2. Switch Context to Org B User
        var userBId = Guid.NewGuid();
        _tenantContext.SetContext(orgBId, userBId, Roles.Owner);

        // 3. Query Invitations as Org B
        using (var dbB = new IdentityTenancyDbContext(_identityDbOptions, _tenantContext))
        {
            var invitationsVisibleToB = await dbB.Invitations.ToListAsync();
            
            // Org B must see 0 invitations from Org A
            Assert.Empty(invitationsVisibleToB);
        }
    }

    [Fact]
    public async Task WriteIsolation_OrgB_CannotModifyOrWrite_OrgA_Data()
    {
        var orgAId = Guid.NewGuid();
        var orgBId = Guid.NewGuid();
        var userAId = Guid.NewGuid();
        var userBId = Guid.NewGuid();

        // 1. Act as Org A: Create Invitation
        _tenantContext.SetContext(orgAId, userAId, Roles.Owner);
        using (var dbA = new IdentityTenancyDbContext(_identityDbOptions, _tenantContext))
        {
            var orgA = new Organization { Id = orgAId, Name = "Org A Textiles", Slug = "org-a-2", Sector = "RMG" };
            dbA.Organizations.Add(orgA);

            var invA = new Invitation
            {
                OrgId = orgAId,
                Role = Roles.FloorStaff,
                Token = "token-org-a-write",
                PinHash = "hash123",
                ExpiresAtUtc = DateTime.UtcNow.AddDays(7),
                CreatedByUserId = userAId
            };
            dbA.Invitations.Add(invA);
            await dbA.SaveChangesAsync();
        }

        // 2. Switch Context to Org B User
        _tenantContext.SetContext(orgBId, userBId, Roles.Owner);

        // 3. Attempt to insert entity with Org A's ID while active context is Org B -> Throws CrossTenantAccessException
        using (var dbB = new IdentityTenancyDbContext(_identityDbOptions, _tenantContext))
        {
            var maliciousInv = new Invitation
            {
                OrgId = orgAId, // Mismatched OrgId!
                Role = Roles.FloorStaff,
                Token = "malicious-token",
                PinHash = "hash123",
                ExpiresAtUtc = DateTime.UtcNow.AddDays(7),
                CreatedByUserId = userBId
            };
            dbB.Invitations.Add(maliciousInv);

            await Assert.ThrowsAsync<CrossTenantAccessException>(async () =>
            {
                await dbB.SaveChangesAsync();
            });
        }
    }

    [Fact]
    public async Task AuditLog_TenantIsolation_AndStamping_Works()
    {
        var orgAId = Guid.NewGuid();
        var orgBId = Guid.NewGuid();
        var userAId = Guid.NewGuid();

        // Act as Org A
        _tenantContext.SetContext(orgAId, userAId, Roles.Owner);
        using (var auditDbA = new AuditDbContext(_auditDbOptions, _tenantContext))
        {
            var log = new AuditLog
            {
                Action = "Document.Confirmed",
                EntityType = "Document",
                EntityId = Guid.NewGuid().ToString(),
                UserEmail = "user@orgA.local"
            };
            auditDbA.AuditLogs.Add(log);
            await auditDbA.SaveChangesAsync();

            // Check that OrgId was automatically stamped by interceptor
            Assert.Equal(orgAId, log.OrgId);
        }

        // Switch to Org B
        var userBId = Guid.NewGuid();
        _tenantContext.SetContext(orgBId, userBId, Roles.Owner);

        using (var auditDbB = new AuditDbContext(_auditDbOptions, _tenantContext))
        {
            var logsB = await auditDbB.AuditLogs.ToListAsync();
            Assert.Empty(logsB);
        }
    }

    public void Dispose()
    {
        _connection.Dispose();
        GC.SuppressFinalize(this);
    }
}
