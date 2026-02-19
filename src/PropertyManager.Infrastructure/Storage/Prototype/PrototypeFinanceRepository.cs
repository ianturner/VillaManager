// PropertyManager.Infrastructure - prototype finance repository
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using PropertyManager.Application.Contracts;
using PropertyManager.Application.Contracts.Requests;
using PropertyManager.Application.Services.Repositories;

namespace PropertyManager.Infrastructure.Storage.Prototype;

/// <summary>
/// Prototype finance repository returning empty entries.
/// </summary>
public sealed class PrototypeFinanceRepository : IFinanceRepository
{
    /// <inheritdoc />
    public Task<string> CreateEntryAsync(
        string propertyId,
        FinanceEntryCreateRequestDto request,
        CancellationToken cancellationToken)
    {
        return Task.FromResult("prototype-entry");
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<FinanceEntryDto>> GetEntriesAsync(
        string propertyId,
        CancellationToken cancellationToken)
    {
        return Task.FromResult<IReadOnlyList<FinanceEntryDto>>(Array.Empty<FinanceEntryDto>());
    }
}
