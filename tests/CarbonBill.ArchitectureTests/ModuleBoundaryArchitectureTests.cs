using NetArchTest.Rules;
using Xunit;

namespace CarbonBill.ArchitectureTests;

public class ModuleBoundaryArchitectureTests
{
    private static readonly System.Reflection.Assembly SharedKernelAssembly =
        typeof(CarbonBill.SharedKernel.Domain.BaseEntity).Assembly;

    private static readonly System.Reflection.Assembly IdentityTenancyAssembly =
        typeof(CarbonBill.Modules.IdentityTenancy.Domain.Organization).Assembly;

    private static readonly System.Reflection.Assembly AuditAssembly =
        typeof(CarbonBill.Modules.Audit.Domain.AuditLog).Assembly;

    [Fact]
    public void SharedKernel_ShouldNotDependOn_AnyModule()
    {
        var result = Types.InAssembly(SharedKernelAssembly)
            .ShouldNot()
            .HaveDependencyOn("CarbonBill.Modules")
            .GetResult();

        Assert.True(result.IsSuccessful, "SharedKernel must never depend on any module.");
    }

    [Fact]
    public void IdentityTenancyModule_ShouldNotDependOn_AuditModule()
    {
        var result = Types.InAssembly(IdentityTenancyAssembly)
            .ShouldNot()
            .HaveDependencyOn("CarbonBill.Modules.Audit")
            .GetResult();

        Assert.True(result.IsSuccessful, "IdentityTenancy module must not have a direct dependency on Audit module internals.");
    }

    [Fact]
    public void AuditModule_ShouldNotDependOn_IdentityTenancyModule()
    {
        var result = Types.InAssembly(AuditAssembly)
            .ShouldNot()
            .HaveDependencyOn("CarbonBill.Modules.IdentityTenancy")
            .GetResult();

        Assert.True(result.IsSuccessful, "Audit module must not have a direct dependency on IdentityTenancy module internals.");
    }
}
