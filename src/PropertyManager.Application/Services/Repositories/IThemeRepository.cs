// PropertyManager.Application - repository contracts
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using PropertyManager.Application.Contracts;

namespace PropertyManager.Application.Services.Repositories;

/// <summary>
/// Provides access to shared themes.
/// </summary>
public interface IThemeRepository
{
    /// <summary>
    /// Gets all themes.
    /// </summary>
    Task<IReadOnlyList<ThemeLibraryDto>> GetAllAsync(CancellationToken cancellationToken);

    /// <summary>
    /// Gets a theme by name.
    /// </summary>
    Task<ThemeLibraryDto?> GetByNameAsync(string name, CancellationToken cancellationToken);

    /// <summary>
    /// Creates a new theme.
    /// </summary>
    Task CreateAsync(ThemeLibraryDto theme, CancellationToken cancellationToken);

    /// <summary>
    /// Updates an existing theme.
    /// </summary>
    Task UpdateAsync(ThemeLibraryDto theme, CancellationToken cancellationToken);

    /// <summary>
    /// Deletes a theme by name.
    /// </summary>
    Task DeleteAsync(string name, CancellationToken cancellationToken);
}
