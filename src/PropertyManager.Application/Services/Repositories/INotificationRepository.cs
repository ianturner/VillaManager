// PropertyManager.Application - repository contracts
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using PropertyManager.Application.Contracts;

namespace PropertyManager.Application.Services.Repositories;

/// <summary>
/// Provides access to notification data.
/// </summary>
public interface INotificationRepository
{
    /// <summary>
    /// Gets notifications for the current user.
    /// </summary>
    Task<IReadOnlyList<NotificationDto>> GetForUserAsync(
        string userId,
        CancellationToken cancellationToken);
}
