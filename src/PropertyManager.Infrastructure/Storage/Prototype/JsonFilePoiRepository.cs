// PropertyManager.Infrastructure - prototype POI repository
using System;
using System.Collections.Generic;
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
/// Reads POI data from JSON files on disk (prototype mode).
/// </summary>
public sealed class JsonFilePoiRepository : IPoiRepository
{
    private static readonly string[] ImageExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
    private readonly PrototypeDataOptions _options;
    private readonly IHostEnvironment _environment;
    private readonly JsonSerializerOptions _serializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new LocalizedStringJsonConverter() }
    };

    /// <summary>
    /// Initializes a new instance of the <see cref="JsonFilePoiRepository"/> class.
    /// </summary>
    public JsonFilePoiRepository(IOptions<PrototypeDataOptions> options, IHostEnvironment environment)
    {
        _options = options.Value;
        _environment = environment;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<PoiDto>> GetByPropertyIdAsync(string propertyId, CancellationToken cancellationToken)
    {
        var rootPath = PrototypeDataPath.ResolveRootPath(_options, _environment);
        var poiRoot = Path.Combine(rootPath, "properties", propertyId, "poi");

        if (!Directory.Exists(poiRoot))
        {
            return Task.FromResult<IReadOnlyList<PoiDto>>(Array.Empty<PoiDto>());
        }

        var poiList = new List<PoiDto>();

        foreach (var directory in Directory.EnumerateDirectories(poiRoot))
        {
            var dataPath = Path.Combine(directory, "data.json");
            if (!File.Exists(dataPath))
            {
                continue;
            }

            using var stream = File.OpenRead(dataPath);
            var poi = JsonSerializer.Deserialize<PoiDto>(stream, _serializerOptions);
            if (poi is null)
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(poi.Id))
            {
                poi = poi with { Id = Path.GetFileName(directory) };
            }

            poiList.Add(poi);
        }

        var ordered = poiList
            .OrderBy(poi => poi.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        return Task.FromResult<IReadOnlyList<PoiDto>>(ordered);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<ImageDto>> GetPoiImagesAsync(
        string propertyId,
        string poiId,
        CancellationToken cancellationToken)
    {
        var rootPath = PrototypeDataPath.ResolveRootPath(_options, _environment);
        var imagesPath = Path.Combine(rootPath, "properties", propertyId, "poi", poiId, "images");

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
    public Task<IReadOnlyList<PdfDto>> GetPoiPdfsAsync(
        string propertyId,
        string poiId,
        CancellationToken cancellationToken)
    {
        var rootPath = PrototypeDataPath.ResolveRootPath(_options, _environment);
        var pdfPath = Path.Combine(rootPath, "properties", propertyId, "poi", poiId, "pdfs");

        var pdfs = EnumerateFiles(pdfPath, new[] { ".pdf" })
            .Select(path => new PdfDto
            {
                Id = Path.GetFileNameWithoutExtension(path),
                Title = LocalizedString.FromString(ToTitle(Path.GetFileNameWithoutExtension(path))),
                Type = "poi",
                Src = PrototypeDataPath.ToPublicUrl(rootPath, _options.PublicBasePath, path)
            })
            .ToList();

        return Task.FromResult<IReadOnlyList<PdfDto>>(pdfs);
    }

    /// <inheritdoc />
    public Task<string> CreateAsync(string propertyId, PoiCreateRequestDto request, CancellationToken cancellationToken)
    {
        throw new NotSupportedException("Prototype data is read-only.");
    }

    private static IEnumerable<string> EnumerateFiles(string path, string[] extensions)
    {
        if (!Directory.Exists(path))
        {
            return Array.Empty<string>();
        }

        return Directory.EnumerateFiles(path, "*", SearchOption.TopDirectoryOnly)
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
