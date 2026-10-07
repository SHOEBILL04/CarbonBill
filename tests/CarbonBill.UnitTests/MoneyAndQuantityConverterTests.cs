using CarbonBill.SharedKernel.Persistence.ValueConverters;
using Xunit;

namespace CarbonBill.UnitTests;

public class MoneyAndQuantityConverterTests
{
    [Theory]
    [InlineData(100.50, 10050)]
    [InlineData(0.01, 1)]
    [InlineData(1234567.89, 123456789)]
    [InlineData(0.00, 0)]
    public void PaisaMoneyConverter_ConvertsAccurately(decimal bdt, long expectedPaisa)
    {
        var converter = new PaisaMoneyConverter();

        var toPaisa = (long)converter.ConvertToProvider(bdt)!;
        Assert.Equal(expectedPaisa, toPaisa);

        var backToBdt = (decimal)converter.ConvertFromProvider(toPaisa)!;
        Assert.Equal(bdt, backToBdt);
    }

    [Theory]
    [InlineData(1250.123456, 1250123456)]
    [InlineData(0.000001, 1)]
    [InlineData(450.50, 450500000)]
    public void ScaledQuantityConverter_ConvertsAccurately(decimal quantity, long expectedMicroUnits)
    {
        var converter = new ScaledQuantityConverter(6);

        var toProvider = (long)converter.ConvertToProvider(quantity)!;
        Assert.Equal(expectedMicroUnits, toProvider);

        var backToModel = (decimal)converter.ConvertFromProvider(toProvider)!;
        Assert.Equal(quantity, backToModel);
    }
}
