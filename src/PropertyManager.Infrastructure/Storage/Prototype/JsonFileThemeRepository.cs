// PropertyManager.Infrastructure - prototype theme repository
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using PropertyManager.Application.Contracts;
using PropertyManager.Application.Services.Repositories;

namespace PropertyManager.Infrastructure.Storage.Prototype;

/// <summary>
/// Reads themes from JSON files on disk (prototype mode).
/// </summary>
public sealed class JsonFileThemeRepository : IThemeRepository
{
    private readonly PrototypeDataOptions _prototypeOptions;
    private readonly ThemeStoreOptions _themeOptions;
    private readonly IHostEnvironment _environment;
    private readonly JsonSerializerOptions _serializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = true
    };

    /// <summary>
    /// Initializes a new instance of the <see cref="JsonFileThemeRepository"/> class.
    /// </summary>
    public JsonFileThemeRepository(
        IOptions<PrototypeDataOptions> prototypeOptions,
        IOptions<ThemeStoreOptions> themeOptions,
        IHostEnvironment environment)
    {
        _prototypeOptions = prototypeOptions.Value;
        _themeOptions = themeOptions.Value;
        _environment = environment;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<ThemeLibraryDto>> GetAllAsync(CancellationToken cancellationToken)
        => await ReadThemesAsync(cancellationToken);

    /// <inheritdoc />
    public async Task<ThemeLibraryDto?> GetByNameAsync(string name, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return null;
        }

        var themes = await ReadThemesAsync(cancellationToken);
        return themes.FirstOrDefault(theme =>
            theme.Name.Equals(name, System.StringComparison.OrdinalIgnoreCase));
    }

    /// <inheritdoc />
    public async Task CreateAsync(ThemeLibraryDto theme, CancellationToken cancellationToken)
    {
        var themes = await ReadThemesAsync(cancellationToken);
        themes.Add(theme);
        await WriteThemesAsync(themes, cancellationToken);
    }

    /// <inheritdoc />
    public async Task UpdateAsync(ThemeLibraryDto theme, CancellationToken cancellationToken)
    {
        var themes = await ReadThemesAsync(cancellationToken);
        var index = themes.FindIndex(item =>
            item.Name.Equals(theme.Name, System.StringComparison.OrdinalIgnoreCase));
        if (index < 0)
        {
            return;
        }
        themes[index] = theme;
        await WriteThemesAsync(themes, cancellationToken);
    }

    /// <inheritdoc />
    public async Task DeleteAsync(string name, CancellationToken cancellationToken)
    {
        var themes = await ReadThemesAsync(cancellationToken);
        themes.RemoveAll(item => item.Name.Equals(name, System.StringComparison.OrdinalIgnoreCase));
        await WriteThemesAsync(themes, cancellationToken);
    }

    private async Task<List<ThemeLibraryDto>> ReadThemesAsync(CancellationToken cancellationToken)
    {
        var rootPath = PrototypeDataPath.ResolveRootPath(_prototypeOptions, _environment);
        var themesPath = Path.Combine(rootPath, _themeOptions.ThemesFile);

        if (!File.Exists(themesPath))
        {
            return new List<ThemeLibraryDto>();
        }

        await using var stream = File.OpenRead(themesPath);
        var themes = await JsonSerializer.DeserializeAsync<List<ThemeLibraryDto>>(
            stream,
            _serializerOptions,
            cancellationToken);

        return themes ?? new List<ThemeLibraryDto>();
    }

    private async Task WriteThemesAsync(List<ThemeLibraryDto> themes, CancellationToken cancellationToken)
    {
        var rootPath = PrototypeDataPath.ResolveRootPath(_prototypeOptions, _environment);
        var themesPath = Path.Combine(rootPath, _themeOptions.ThemesFile);
        Directory.CreateDirectory(Path.GetDirectoryName(themesPath) ?? rootPath);

        await using var stream = File.Create(themesPath);
        await JsonSerializer.SerializeAsync(stream, themes, _serializerOptions, cancellationToken);
    }
}
