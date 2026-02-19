// PropertyManager.Application - repository contracts
using System.Threading;
using System.Threading.Tasks;
using PropertyManager.Application.Contracts;
using PropertyManager.Application.Contracts.Requests;

namespace PropertyManager.Application.Services.Repositories;

/// <summary>
/// Provides access to messaging data.
/// </summary>
public interface IMessagingRepository
{
    /// <summary>
    /// Creates a message and returns thread/message identifiers.
    /// </summary>
    Task<(string ThreadId, string MessageId)> CreateMessageAsync(
        MessageCreateRequestDto request,
        CancellationToken cancellationToken);

    /// <summary>
    /// Gets a thread by identifier.
    /// </summary>
    Task<MessageThreadDto?> GetThreadAsync(string threadId, CancellationToken cancellationToken);
}
