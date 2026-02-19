// PropertyManager.Application - repository contracts
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using PropertyManager.Application.Contracts;
using PropertyManager.Application.Contracts.Requests;

namespace PropertyManager.Application.Services.Repositories;

/// <summary>
/// Provides access to POI data.
/// </summary>
public interface IPoiRepository
{
    /// <summary>
    /// Gets POIs for a property.
    /// </summary>
    Task<IReadOnlyList<PoiDto>> GetByPropertyIdAsync(string propertyId, CancellationToken cancellationToken);

    /// <summary>
    /// Gets images for a POI.
    /// </summary>
    Task<IReadOnlyList<ImageDto>> GetPoiImagesAsync(
        string propertyId,
        string poiId,
        CancellationToken cancellationToken);

    /// <summary>
    /// Gets PDFs for a POI.
    /// </summary>
    Task<IReadOnlyList<PdfDto>> GetPoiPdfsAsync(
        string propertyId,
        string poiId,
        CancellationToken cancellationToken);

    /// <summary>
    /// Creates a POI.
    /// </summary>
    Task<string> CreateAsync(
        string propertyId,
        PoiCreateRequestDto request,
        CancellationToken cancellationToken);
}
