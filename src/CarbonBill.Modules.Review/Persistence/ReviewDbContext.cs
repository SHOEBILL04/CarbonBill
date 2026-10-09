using CarbonBill.Modules.Review.Domain;
using CarbonBill.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace CarbonBill.Modules.Review.Persistence;

public class ReviewDbContext(DbContextOptions<ReviewDbContext> options, ITenantContext tenantContext)
    : DbContext(options)
{
    public DbSet<ReviewDecision> Decisions => Set<ReviewDecision>();
    public DbSet<ReviewOrganizationSetting> OrganizationSettings => Set<ReviewOrganizationSetting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ReviewDecision>(b =>
        {
            b.HasKey(e => e.Id);
            b.HasIndex(e => new { e.OrgId, e.DocumentId });
            b.HasQueryFilter(e => tenantContext.CurrentOrgId == null || e.OrgId == tenantContext.CurrentOrgId);
        });

        modelBuilder.Entity<ReviewOrganizationSetting>(b =>
        {
            b.HasKey(e => e.Id);
            b.HasIndex(e => e.OrgId).IsUnique();
            b.HasQueryFilter(e => tenantContext.CurrentOrgId == null || e.OrgId == tenantContext.CurrentOrgId);
        });
    }
}
