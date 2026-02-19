// PropertyManager.Application - repository contracts
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using PropertyManager.Application.Contracts;
using PropertyManager.Application.Contracts.Requests;

namespace PropertyManager.Application.Services.Repositories;

/// <summary>
/// Provides access to finance data.
/// </summary>
public interface IFinanceRepository
{
    /// <summary>
    /// Creates a finance entry.
    /// </summary>
    Task<string> CreateEntryAsync(
        string propertyId,
        FinanceEntryCreateRequestDto request,
        CancellationToken cancellationToken);

    /// <summary>
    /// Gets finance entries for a property.
    /// </summary>
    Task<IReadOnlyList<FinanceEntryDto>> GetEntriesAsync(
        string propertyId,
        CancellationToken cancellationToken);
}
