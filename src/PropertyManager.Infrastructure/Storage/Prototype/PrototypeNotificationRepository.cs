// PropertyManager.Infrastructure - prototype notification repository
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using PropertyManager.Application.Contracts;
using PropertyManager.Application.Services.Repositories;

namespace PropertyManager.Infrastructure.Storage.Prototype;

/// <summary>
/// Prototype notification repository returning empty notifications.
/// </summary>
public sealed class PrototypeNotificationRepository : INotificationRepository
{
    /// <inheritdoc />
    public Task<IReadOnlyList<NotificationDto>> GetForUserAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        return Task.FromResult<IReadOnlyList<NotificationDto>>(Array.Empty<NotificationDto>());
    }
}
