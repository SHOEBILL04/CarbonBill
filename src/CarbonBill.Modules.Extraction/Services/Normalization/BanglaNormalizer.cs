using System.Text.RegularExpressions;

namespace CarbonBill.Modules.Extraction.Services.Normalization;

public static partial class BanglaNormalizer
{
    private static readonly Dictionary<char, char> BanglaToLatinDigitMap = new()
    {
        ['০'] = '0', ['১'] = '1', ['২'] = '2', ['৩'] = '3', ['৪'] = '4',
        ['৫'] = '5', ['৬'] = '6', ['৭'] = '7', ['৮'] = '8', ['৯'] = '9'
    };

    private static readonly Dictionary<string, string> UnitSynonyms = new(StringComparer.OrdinalIgnoreCase)
    {
        // Litre
        ["লিটার"] = "litre",
        ["লিঃ"] = "litre",
        ["লি"] = "litre",
        ["ltr"] = "litre",
        ["ltrs"] = "litre",
        ["liter"] = "litre",
        ["liters"] = "litre",
        ["l"] = "litre",

        // Kilowatt-hour
        ["কেডব্লিউএইচ"] = "kWh",
        ["কিলোওয়াট"] = "kWh",
        ["ইউনিট"] = "kWh",
        ["kwh"] = "kWh",
        ["kw-h"] = "kWh",
        ["units"] = "kWh",
        ["unit"] = "kWh",

        // Kilogram
        ["কেজি"] = "kg",
        ["কিলোগ্রাম"] = "kg",
        ["kg"] = "kg",
        ["kgs"] = "kg",
        ["kilogram"] = "kg",

        // Cubic meter
        ["ঘনমিটার"] = "m3",
        ["m3"] = "m3",
        ["cum"] = "m3",
        ["cu.m"] = "m3",
        ["cubic meter"] = "m3"
    };

    public static string NormalizeDigits(string? input)
    {
        if (string.IsNullOrEmpty(input)) return string.Empty;

        var sb = new System.Text.StringBuilder(input.Length);
        foreach (var ch in input)
        {
            if (BanglaToLatinDigitMap.TryGetValue(ch, out var latinDigit))
            {
                sb.Append(latinDigit);
            }
            else
            {
                sb.Append(ch);
            }
        }
        return sb.ToString();
    }

    public static string NormalizeUnit(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;

        var trimmed = input.Trim();
        if (UnitSynonyms.TryGetValue(trimmed, out var canonicalUnit))
        {
            return canonicalUnit;
        }

        // Return lowercase clean input if no direct mapping
        return trimmed.ToLowerInvariant();
    }

    public static decimal? ExtractNumericValue(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return null;

        var normalized = NormalizeDigits(input);
        // Match integers or decimals, removing commas
        var match = NumericRegex().Match(normalized.Replace(",", ""));
        if (match.Success && decimal.TryParse(match.Value, System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out var val))
        {
            return val;
        }
        return null;
    }

    [GeneratedRegex(@"[-+]?\d*\.?\d+")]
    private static partial Regex NumericRegex();
}
