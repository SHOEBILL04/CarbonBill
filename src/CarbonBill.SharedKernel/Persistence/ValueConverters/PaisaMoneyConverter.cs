using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace CarbonBill.SharedKernel.Persistence.ValueConverters;

/// <summary>
/// Converts BDT decimal amount to integer Paisa (1 BDT = 100 Paisa) for storage in SQLite.
/// Prevents SQLite floating-point errors while keeping exact decimal arithmetic in C# code.
/// </summary>
public class PaisaMoneyConverter() : ValueConverter<decimal, long>(
    v => (long)Math.Round(v * 100m, MidpointRounding.AwayFromZero),
    v => (decimal)v / 100m)
{
}

/// <summary>
/// Converts high-precision decimal quantities (kWh, litres, kg, tCO2e) to scaled 64-bit integer
/// with 6 decimal places (micro-unit scale: 1.000000 = 1,000,000).
/// Allows exact aggregation (SUM) in SQLite without floating-point inaccuracies.
/// </summary>
public class ScaledQuantityConverter(int scale = 6) : ValueConverter<decimal, long>(
    v => (long)Math.Round(v * (decimal)Math.Pow(10, scale), MidpointRounding.AwayFromZero),
    v => (decimal)v / (decimal)Math.Pow(10, scale))
{
    public const int DefaultScale = 6;
}
