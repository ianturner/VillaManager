// PropertyManager.Application - repository contracts
using System.Threading;
using System.Threading.Tasks;
using PropertyManager.Application.Contracts;

namespace PropertyManager.Application.Services.Repositories;

/// <summary>
/// Provides access to stored user credentials.
/// </summary>
public interface IUserRepository
{
    /// <summary>
    /// Gets all users.
    /// </summary>
    Task<IReadOnlyList<UserCredentialDto>> GetAllAsync(CancellationToken cancellationToken);

    /// <summary>
    /// Gets a user by username.
    /// </summary>
    Task<UserCredentialDto?> GetByUsernameAsync(string username, CancellationToken cancellationToken);

    /// <summary>
    /// Gets a user by identifier.
    /// </summary>
    Task<UserCredentialDto?> GetByIdAsync(string id, CancellationToken cancellationToken);

    /// <summary>
    /// Creates a new user.
    /// </summary>
    Task CreateAsync(UserCredentialDto user, CancellationToken cancellationToken);

    /// <summary>
    /// Updates an existing user.
    /// </summary>
    Task UpdateAsync(UserCredentialDto user, CancellationToken cancellationToken);

    /// <summary>
    /// Deletes a user by identifier.
    /// </summary>
    Task DeleteAsync(string id, CancellationToken cancellationToken);
}
