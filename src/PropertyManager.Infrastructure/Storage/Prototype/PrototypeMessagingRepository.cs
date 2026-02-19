// PropertyManager.Infrastructure - prototype messaging repository
using System.Threading;
using System.Threading.Tasks;
using PropertyManager.Application.Contracts;
using PropertyManager.Application.Contracts.Requests;
using PropertyManager.Application.Services.Repositories;

namespace PropertyManager.Infrastructure.Storage.Prototype;

/// <summary>
/// Prototype messaging repository returning placeholder data.
/// </summary>
public sealed class PrototypeMessagingRepository : IMessagingRepository
{
    /// <inheritdoc />
    public Task<(string ThreadId, string MessageId)> CreateMessageAsync(
        MessageCreateRequestDto request,
        CancellationToken cancellationToken)
    {
        return Task.FromResult<(string, string)>(("prototype-thread", "prototype-message"));
    }

    /// <inheritdoc />
    public Task<MessageThreadDto?> GetThreadAsync(string threadId, CancellationToken cancellationToken)
    {
        return Task.FromResult<MessageThreadDto?>(new MessageThreadDto
        {
            ThreadId = threadId
        });
    }
}
