// PropertyManager.Application - repository contracts
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using PropertyManager.Application.Contracts;
using PropertyManager.Application.Contracts.Requests;

namespace PropertyManager.Application.Services.Repositories;

/// <summary>
/// Provides access to property data.
/// </summary>
public interface IPropertyRepository
{
    /// <summary>
    /// Gets a property by identifier.
    /// </summary>
    Task<PropertyDto?> GetByIdAsync(string id, CancellationToken cancellationToken);

    /// <summary>
    /// Gets all properties.
    /// </summary>
    Task<IReadOnlyList<PropertyDto>> GetAllAsync(CancellationToken cancellationToken);

    /// <summary>
    /// Gets the latest version of a property by identifier.
    /// </summary>
    Task<PropertyDto?> GetLatestByIdAsync(string id, CancellationToken cancellationToken);

    /// <summary>
    /// Gets the latest version of all properties.
    /// </summary>
    Task<IReadOnlyList<PropertyDto>> GetAllLatestAsync(CancellationToken cancellationToken);

    /// <summary>
    /// Gets images for a property page.
    /// </summary>
    Task<IReadOnlyList<ImageDto>> GetPageImagesAsync(
        string propertyId,
        string page,
        CancellationToken cancellationToken);

    /// <summary>
    /// Gets PDFs for a property.
    /// </summary>
    Task<IReadOnlyList<PdfDto>> GetPropertyPdfsAsync(
        string propertyId,
        CancellationToken cancellationToken);

    /// <summary>
    /// Creates a property shell.
    /// </summary>
    Task<string> CreateAsync(PropertyCreateRequestDto request, CancellationToken cancellationToken);

    /// <summary>
    /// Updates property content.
    /// </summary>
    Task UpdateAsync(string propertyId, PropertyUpdateRequestDto request, CancellationToken cancellationToken);

    /// <summary>
    /// Publishes the latest draft for a property.
    /// </summary>
    Task PublishAsync(string propertyId, CancellationToken cancellationToken);

    /// <summary>
    /// Reverts the latest draft for a property.
    /// </summary>
    Task RevertAsync(string propertyId, CancellationToken cancellationToken);
}
