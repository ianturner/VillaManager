// PropertyManager.Infrastructure - prototype user store options
namespace PropertyManager.Infrastructure.Storage.Prototype;

/// <summary>
/// Configuration for prototype user storage.
/// </summary>
public sealed class UserStoreOptions
{
    /// <summary>
    /// User data file name (relative to prototype root).
    /// </summary>
    public string UsersFile { get; init; } = "users.json";
}
