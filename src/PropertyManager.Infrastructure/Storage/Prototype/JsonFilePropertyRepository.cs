// PropertyManager.Infrastructure - prototype property repository
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using PropertyManager.Application.Contracts;
using PropertyManager.Application.Contracts.Localization;
using PropertyManager.Application.Contracts.Requests;
using PropertyManager.Application.Services.Repositories;

namespace PropertyManager.Infrastructure.Storage.Prototype;

/// <summary>
/// Reads property data from JSON files on disk (prototype mode).
/// </summary>
public sealed class JsonFilePropertyRepository : IPropertyRepository
{
    private static readonly string[] ImageExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
    private readonly PrototypeDataOptions _options;
    private readonly IHostEnvironment _environment;
    private readonly IThemeRepository _themeRepository;
    private readonly JsonSerializerOptions _serializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = true,
        Converters = { new LocalizedStringJsonConverter() }
    };
    private const string DataFileName = "data.json";
    private const string DraftFilePrefix = "data-v";
    private const string ArchiveFilePrefix = "data-archive-v";

    /// <summary>
    /// Initializes a new instance of the <see cref="JsonFilePropertyRepository"/> class.
    /// </summary>
    public JsonFilePropertyRepository(
        IOptions<PrototypeDataOptions> options,
        IHostEnvironment environment,
        IThemeRepository themeRepository)
    {
        _options = options.Value;
        _environment = environment;
        _themeRepository = themeRepository;
    }

    /// <inheritdoc />
    public async Task<PropertyDto?> GetByIdAsync(string id, CancellationToken cancellationToken)
    {
        var rootPath = PrototypeDataPath.ResolveRootPath(_options, _environment);
        var dataPath = Path.Combine(rootPath, "properties", id, DataFileName);

        if (!File.Exists(dataPath))
        {
            return null;
        }

        await using var stream = File.OpenRead(dataPath);
        var property = await JsonSerializer.DeserializeAsync<PropertyDto>(stream, _serializerOptions, cancellationToken);
        if (property is null)
        {
            return null;
        }

        var resolved = ApplyMetadata(property, dataPath, isPublished: true);
        var normalized = NormalizeRentalUnits(resolved);
        return await ResolveThemeAsync(normalized, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<PropertyDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        var rootPath = PrototypeDataPath.ResolveRootPath(_options, _environment);
        var propertiesPath = Path.Combine(rootPath, "properties");

        if (!Directory.Exists(propertiesPath))
        {
            return Array.Empty<PropertyDto>();
        }

        var results = new List<PropertyDto>();
        var themes = await _themeRepository.GetAllAsync(cancellationToken);
        var themeLookup = themes.ToDictionary(theme => theme.Name, StringComparer.OrdinalIgnoreCase);
        foreach (var directory in Directory.EnumerateDirectories(propertiesPath))
        {
            var dataPath = Path.Combine(directory, DataFileName);
            if (!File.Exists(dataPath))
            {
                continue;
            }

            await using var stream = File.OpenRead(dataPath);
            var property = await JsonSerializer.DeserializeAsync<PropertyDto>(stream, _serializerOptions, cancellationToken);
            if (property is not null)
            {
                var resolved = ApplyMetadata(property, dataPath, isPublished: true);
                var normalized = NormalizeRentalUnits(resolved);
                results.Add(ResolveTheme(normalized, themeLookup));
            }
        }

        return results;
    }

    /// <inheritdoc />
    public async Task<PropertyDto?> GetLatestByIdAsync(string id, CancellationToken cancellationToken)
    {
        var rootPath = PrototypeDataPath.ResolveRootPath(_options, _environment);
        var propertyPath = Path.Combine(rootPath, "properties", id);
        var dataPath = GetLatestDataPath(propertyPath);

        if (string.IsNullOrWhiteSpace(dataPath) || !File.Exists(dataPath))
        {
            return null;
        }

        var isPublished = string.Equals(Path.GetFileName(dataPath), DataFileName, StringComparison.OrdinalIgnoreCase);
        await using var stream = File.OpenRead(dataPath);
        var property = await JsonSerializer.DeserializeAsync<PropertyDto>(stream, _serializerOptions, cancellationToken);
        if (property is null)
        {
            return null;
        }

        var normalized = NormalizeRentalUnits(ApplyMetadata(property, dataPath, isPublished));
        return await ResolveThemeAsync(normalized, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<PropertyDto>> GetAllLatestAsync(CancellationToken cancellationToken)
    {
        var rootPath = PrototypeDataPath.ResolveRootPath(_options, _environment);
        var propertiesPath = Path.Combine(rootPath, "properties");

        if (!Directory.Exists(propertiesPath))
        {
            return Array.Empty<PropertyDto>();
        }

        var results = new List<PropertyDto>();
        var themes = await _themeRepository.GetAllAsync(cancellationToken);
        var themeLookup = themes.ToDictionary(theme => theme.Name, StringComparer.OrdinalIgnoreCase);
        foreach (var directory in Directory.EnumerateDirectories(propertiesPath))
        {
            var dataPath = GetLatestDataPath(directory);
            if (string.IsNullOrWhiteSpace(dataPath) || !File.Exists(dataPath))
            {
                continue;
            }

            var isPublished = string.Equals(Path.GetFileName(dataPath), DataFileName, StringComparison.OrdinalIgnoreCase);
            await using var stream = File.OpenRead(dataPath);
            var property = await JsonSerializer.DeserializeAsync<PropertyDto>(stream, _serializerOptions, cancellationToken);
            if (property is not null)
            {
                var resolved = ApplyMetadata(property, dataPath, isPublished);
                var normalized = NormalizeRentalUnits(resolved);
                results.Add(ResolveTheme(normalized, themeLookup));
            }
        }

        return results;
    }
    /// <inheritdoc />
    public Task<IReadOnlyList<ImageDto>> GetPageImagesAsync(
        string propertyId,
        string page,
        CancellationToken cancellationToken)
    {
        var rootPath = PrototypeDataPath.ResolveRootPath(_options, _environment);
        var imagesPath = Path.Combine(rootPath, "properties", propertyId, "pages", page, "images");

        var images = EnumerateFiles(imagesPath, ImageExtensions)
            .Select(path => new ImageDto
            {
                Src = PrototypeDataPath.ToPublicUrl(rootPath, _options.PublicBasePath, path),
                Alt = LocalizedString.FromString(ToAltText(path))
            })
            .ToList();

        return Task.FromResult<IReadOnlyList<ImageDto>>(images);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<PdfDto>> GetPropertyPdfsAsync(string propertyId, CancellationToken cancellationToken)
    {
        var rootPath = PrototypeDataPath.ResolveRootPath(_options, _environment);
        var pdfPath = Path.Combine(rootPath, "properties", propertyId, "pdfs");

        var pdfs = EnumerateFiles(pdfPath, new[] { ".pdf" }, recursive: true)
            .Select(path => new PdfDto
            {
                Id = Path.GetFileNameWithoutExtension(path),
                Title = LocalizedString.FromString(ToTitle(Path.GetFileNameWithoutExtension(path))),
                Type = path.Replace('\\', '/').Contains("/pdfs/directions/", StringComparison.OrdinalIgnoreCase)
                    ? "directions"
                    : "other",
                Src = PrototypeDataPath.ToPublicUrl(rootPath, _options.PublicBasePath, path)
            })
            .ToList();

        return Task.FromResult<IReadOnlyList<PdfDto>>(pdfs);
    }

    /// <inheritdoc />
    public Task<string> CreateAsync(PropertyCreateRequestDto request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Id))
        {
            throw new ArgumentException("Property id is required.", nameof(request));
        }

        var rootPath = PrototypeDataPath.ResolveRootPath(_options, _environment);
        var propertyPath = Path.Combine(rootPath, "properties", request.Id.Trim());
        var dataPath = Path.Combine(propertyPath, DataFileName);

        if (File.Exists(dataPath)
            || (Directory.Exists(propertyPath)
                && Directory.EnumerateFiles(propertyPath, $"{DraftFilePrefix}*.json").Any()))
        {
            throw new InvalidOperationException($"Property '{request.Id}' already exists.");
        }

        Directory.CreateDirectory(propertyPath);

        var version = GetVersionStamp(DateTimeOffset.UtcNow);
        var listingLangs = request.ListingLanguages is { Count: > 0 }
            ? request.ListingLanguages
            : new List<string> { "en", "fr", "de", "el" };
        var property = new PropertyDto
        {
            Id = request.Id.Trim(),
            Name = request.Name,
            Status = request.Status.Trim(),
            Archived = false,
            Version = version,
            IsPublished = false,
            Pages = new List<PropertyPageDto>(),
            ExternalLinks = new List<ExternalLinkDto>(),
            Facilities = new List<PropertyFacilityCategoryDto>(),
            Pdfs = new List<PdfDto>(),
            ListingLanguages = listingLangs
        };

        var draftPath = Path.Combine(propertyPath, $"{DraftFilePrefix}{version}.json");
        File.WriteAllText(draftPath, JsonSerializer.Serialize(property, _serializerOptions));

        return Task.FromResult(property.Id);
    }

    /// <inheritdoc />
    public Task UpdateAsync(string propertyId, PropertyUpdateRequestDto request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(propertyId))
        {
            throw new ArgumentException("Property id is required.", nameof(propertyId));
        }

        var rootPath = PrototypeDataPath.ResolveRootPath(_options, _environment);
        var propertyPath = Path.Combine(rootPath, "properties", propertyId);
        var dataPath = GetLatestDataPath(propertyPath);

        if (string.IsNullOrWhiteSpace(dataPath) || !File.Exists(dataPath))
        {
            throw new FileNotFoundException("Property data not found.", dataPath);
        }

        var existingJson = File.ReadAllText(dataPath);
        var property = JsonSerializer.Deserialize<PropertyDto>(existingJson, _serializerOptions)
            ?? throw new InvalidOperationException("Property data is invalid.");
        property = NormalizeRentalUnits(property);

        var rentalUnits = request.RentalUnits
            ?? (request.Rental is not null ? new List<RentalDto> { request.Rental } : null)
            ?? new List<RentalDto>(RentalUnitHelper.GetRentalUnits(property));

        var version = GetVersionStamp(DateTimeOffset.UtcNow);
        var updated = property with
        {
            Name = request.Name ?? property.Name,
            Status = request.Status ?? property.Status,
            Archived = request.Archived ?? property.Archived,
            Summary = request.Summary ?? property.Summary,
            HeroImages = request.HeroImages ?? property.HeroImages,
            HeroSettings = request.HeroSettings ?? property.HeroSettings,
            Pages = request.Pages ?? property.Pages,
            Places = request.Places ?? property.Places,
            Theme = (request.ThemeName ?? property.ThemeName) is not null
                ? null
                : request.Theme ?? property.Theme,
            ThemeName = request.ThemeName ?? property.ThemeName,
            Facts = request.Facts ?? property.Facts,
            ExternalLinks = request.ExternalLinks ?? property.ExternalLinks,
            Location = request.Location ?? property.Location,
            Facilities = request.Facilities ?? property.Facilities,
            Pdfs = request.Pdfs ?? property.Pdfs,
            SalesParticulars = request.SalesParticulars ?? property.SalesParticulars,
            Rental = null,
            RentalUnits = rentalUnits,
            GuestInfo = request.GuestInfo ?? property.GuestInfo,
            ListingLanguages = request.ListingLanguages ?? property.ListingLanguages,
            Version = version,
            IsPublished = false
        };

        var draftPath = Path.Combine(propertyPath, $"{DraftFilePrefix}{version}.json");
        File.WriteAllText(draftPath, JsonSerializer.Serialize(updated, _serializerOptions));

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task PublishAsync(string propertyId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(propertyId))
        {
            throw new ArgumentException("Property id is required.", nameof(propertyId));
        }

        var rootPath = PrototypeDataPath.ResolveRootPath(_options, _environment);
        var propertyPath = Path.Combine(rootPath, "properties", propertyId);
        var latestDraftPath = GetLatestDraftPath(propertyPath);

        if (string.IsNullOrWhiteSpace(latestDraftPath) || !File.Exists(latestDraftPath))
        {
            return Task.CompletedTask;
        }

        var draftJson = File.ReadAllText(latestDraftPath);
        var draft = JsonSerializer.Deserialize<PropertyDto>(draftJson, _serializerOptions)
            ?? throw new InvalidOperationException("Property data is invalid.");
        var draftVersion = draft.Version;
        if (string.IsNullOrWhiteSpace(draftVersion))
        {
            draftVersion = TryExtractVersion(Path.GetFileName(latestDraftPath), DraftFilePrefix)
                ?? GetVersionStamp(DateTimeOffset.UtcNow);
        }

        var published = draft with
        {
            Version = draftVersion,
            IsPublished = true
        };

        var dataPath = Path.Combine(propertyPath, DataFileName);
        var archiveDir = Path.Combine(propertyPath, "archive");
        Directory.CreateDirectory(archiveDir);
        if (File.Exists(dataPath))
        {
            var existingJson = File.ReadAllText(dataPath);
            var existing = JsonSerializer.Deserialize<PropertyDto>(existingJson, _serializerOptions);
            var existingVersion = existing?.Version;
            if (string.IsNullOrWhiteSpace(existingVersion))
            {
                existingVersion = GetVersionStamp(File.GetLastWriteTimeUtc(dataPath));
            }

            var archivePath = Path.Combine(archiveDir, $"{ArchiveFilePrefix}{existingVersion}.json");
            if (File.Exists(archivePath))
            {
                archivePath = Path.Combine(
                    archiveDir,
                    $"{ArchiveFilePrefix}{existingVersion}-{GetVersionStamp(DateTimeOffset.UtcNow)}.json");
            }

            File.Move(dataPath, archivePath);
        }

        var tempPath = Path.Combine(propertyPath, $"data-publish-{draftVersion}.json");
        File.WriteAllText(tempPath, JsonSerializer.Serialize(published, _serializerOptions));
        File.Move(tempPath, dataPath, overwrite: true);
        var publishedJson = File.ReadAllText(dataPath);
        _ = JsonSerializer.Deserialize<PropertyDto>(publishedJson, _serializerOptions)
            ?? throw new InvalidOperationException("Published property data is invalid.");

        var draftFiles = Directory.EnumerateFiles(propertyPath, $"{DraftFilePrefix}*.json").ToList();
        foreach (var draftFile in draftFiles)
        {
            var draftName = Path.GetFileName(draftFile);
            var destination = Path.Combine(archiveDir, draftName);
            if (File.Exists(destination))
            {
                destination = Path.Combine(
                    archiveDir,
                    $"{Path.GetFileNameWithoutExtension(draftName)}-{GetVersionStamp(DateTimeOffset.UtcNow)}.json");
            }
            File.Move(draftFile, destination);
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task RevertAsync(string propertyId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(propertyId))
        {
            throw new ArgumentException("Property id is required.", nameof(propertyId));
        }

        var rootPath = PrototypeDataPath.ResolveRootPath(_options, _environment);
        var propertyPath = Path.Combine(rootPath, "properties", propertyId);
        var latestDraftPath = GetLatestDraftPath(propertyPath);

        if (!string.IsNullOrWhiteSpace(latestDraftPath) && File.Exists(latestDraftPath))
        {
            File.Delete(latestDraftPath);
        }

        return Task.CompletedTask;
    }

    private async Task<PropertyDto> ResolveThemeAsync(PropertyDto property, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(property.ThemeName))
        {
            return property;
        }

        var theme = await _themeRepository.GetByNameAsync(property.ThemeName, cancellationToken);
        return theme is null
            ? property
            : property with { Theme = ToThemeDto(theme) };
    }

    private static PropertyDto ApplyMetadata(PropertyDto property, string dataPath, bool isPublished)
    {
        var version = property.Version;
        if (string.IsNullOrWhiteSpace(version))
        {
            version = TryExtractVersion(Path.GetFileName(dataPath), DraftFilePrefix)
                ?? TryExtractVersion(Path.GetFileName(dataPath), ArchiveFilePrefix);
        }

        if (string.IsNullOrWhiteSpace(version) && File.Exists(dataPath))
        {
            version = GetVersionStamp(File.GetLastWriteTimeUtc(dataPath));
        }

        return property with
        {
            Version = version,
            IsPublished = isPublished
        };
    }

    /// <summary>
    /// Ensures RentalUnits is populated: when JSON has only Rental (legacy), treat it as a single unit.
    /// </summary>
    private static PropertyDto NormalizeRentalUnits(PropertyDto property)
    {
        if (property.RentalUnits is { Count: > 0 })
        {
            return property;
        }

        if (property.Rental is null)
        {
            return property with { RentalUnits = new List<RentalDto>() };
        }

        return property with { RentalUnits = new List<RentalDto> { property.Rental } };
    }

    private static string? GetLatestDataPath(string propertyPath)
    {
        var draftPath = GetLatestDraftPath(propertyPath);
        if (!string.IsNullOrWhiteSpace(draftPath))
        {
            return draftPath;
        }

        var publishedPath = Path.Combine(propertyPath, DataFileName);
        return File.Exists(publishedPath) ? publishedPath : null;
    }

    private static string? GetLatestDraftPath(string propertyPath)
    {
        if (!Directory.Exists(propertyPath))
        {
            return null;
        }

        var latestDraft = Directory
            .EnumerateFiles(propertyPath, $"{DraftFilePrefix}*.json")
            .Select(path => new { Path = path, Name = Path.GetFileName(path) })
            .OrderBy(entry => entry.Name, StringComparer.OrdinalIgnoreCase)
            .LastOrDefault();

        return latestDraft?.Path;
    }

    private static string? TryExtractVersion(string fileName, string prefix)
    {
        if (!fileName.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
            || !fileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var version = fileName.Substring(
            prefix.Length,
            fileName.Length - prefix.Length - ".json".Length);
        return string.IsNullOrWhiteSpace(version) ? null : version;
    }

    private static string GetVersionStamp(DateTimeOffset timestamp)
        => timestamp.ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture);

    private static PropertyDto ResolveTheme(
        PropertyDto property,
        IDictionary<string, ThemeLibraryDto> themes)
    {
        if (string.IsNullOrWhiteSpace(property.ThemeName))
        {
            return property;
        }

        return themes.TryGetValue(property.ThemeName, out var theme)
            ? property with { Theme = ToThemeDto(theme) }
            : property;
    }

    private static ThemeDto ToThemeDto(ThemeLibraryDto theme)
        => new()
        {
            Name = theme.Name,
            DefaultMode = theme.DefaultMode,
            Light = theme.Light,
            Dark = theme.Dark,
            Fonts = theme.Fonts,
            HeadingSizes = theme.HeadingSizes,
            HeadingTransforms = theme.HeadingTransforms,
            BodyTextSize = theme.BodyTextSize,
            CornerRadius = theme.CornerRadius
        };

    private static IEnumerable<string> EnumerateFiles(string path, string[] extensions, bool recursive = false)
    {
        if (!Directory.Exists(path))
        {
            return Array.Empty<string>();
        }

        var option = recursive ? SearchOption.AllDirectories : SearchOption.TopDirectoryOnly;

        return Directory.EnumerateFiles(path, "*", option)
            .Where(file => extensions.Contains(Path.GetExtension(file), StringComparer.OrdinalIgnoreCase))
            .OrderBy(file => file, StringComparer.OrdinalIgnoreCase);
    }

    private static string ToAltText(string path)
    {
        var name = Path.GetFileNameWithoutExtension(path);
        return name.Replace('_', ' ').Replace('-', ' ');
    }

    private static string ToTitle(string value)
    {
        return value.Replace('_', ' ').Replace('-', ' ');
    }
}
