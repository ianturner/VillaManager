// PropertyManager.Infrastructure - prototype user repository
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using PropertyManager.Application.Contracts;
using PropertyManager.Application.Services.Repositories;

namespace PropertyManager.Infrastructure.Storage.Prototype;

/// <summary>
/// Reads user credentials from JSON files on disk (prototype mode).
/// </summary>
public sealed class JsonFileUserRepository : IUserRepository
{
    private readonly PrototypeDataOptions _prototypeOptions;
    private readonly UserStoreOptions _userOptions;
    private readonly IHostEnvironment _environment;
    private readonly JsonSerializerOptions _serializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = true
    };

    /// <summary>
    /// Initializes a new instance of the <see cref="JsonFileUserRepository"/> class.
    /// </summary>
    public JsonFileUserRepository(
        IOptions<PrototypeDataOptions> prototypeOptions,
        IOptions<UserStoreOptions> userOptions,
        IHostEnvironment environment)
    {
        _prototypeOptions = prototypeOptions.Value;
        _userOptions = userOptions.Value;
        _environment = environment;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<UserCredentialDto>> GetAllAsync(CancellationToken cancellationToken)
        => await ReadUsersAsync(cancellationToken);

    /// <inheritdoc />
    public async Task<UserCredentialDto?> GetByUsernameAsync(string username, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            return null;
        }

        var users = await ReadUsersAsync(cancellationToken);
        return users.FirstOrDefault(user =>
            user.Username.Equals(username, System.StringComparison.OrdinalIgnoreCase));
    }

    /// <inheritdoc />
    public async Task<UserCredentialDto?> GetByIdAsync(string id, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return null;
        }

        var users = await ReadUsersAsync(cancellationToken);
        return users.FirstOrDefault(user => user.Id == id);
    }

    /// <inheritdoc />
    public async Task CreateAsync(UserCredentialDto user, CancellationToken cancellationToken)
    {
        var users = await ReadUsersAsync(cancellationToken);
        users.Add(user);
        await WriteUsersAsync(users, cancellationToken);
    }

    /// <inheritdoc />
    public async Task UpdateAsync(UserCredentialDto user, CancellationToken cancellationToken)
    {
        var users = await ReadUsersAsync(cancellationToken);
        var index = users.FindIndex(item => item.Id == user.Id);
        if (index < 0)
        {
            return;
        }
        users[index] = user;
        await WriteUsersAsync(users, cancellationToken);
    }

    /// <inheritdoc />
    public async Task DeleteAsync(string id, CancellationToken cancellationToken)
    {
        var users = await ReadUsersAsync(cancellationToken);
        users.RemoveAll(user => user.Id == id);
        await WriteUsersAsync(users, cancellationToken);
    }

    private async Task<List<UserCredentialDto>> ReadUsersAsync(CancellationToken cancellationToken)
    {
        var rootPath = PrototypeDataPath.ResolveRootPath(_prototypeOptions, _environment);
        var usersPath = Path.Combine(rootPath, _userOptions.UsersFile);

        if (!File.Exists(usersPath))
        {
            return new List<UserCredentialDto>();
        }

        await using var stream = File.OpenRead(usersPath);
        var users = await JsonSerializer.DeserializeAsync<List<UserCredentialDto>>(
            stream,
            _serializerOptions,
            cancellationToken);

        return users ?? new List<UserCredentialDto>();
    }

    private async Task WriteUsersAsync(List<UserCredentialDto> users, CancellationToken cancellationToken)
    {
        var rootPath = PrototypeDataPath.ResolveRootPath(_prototypeOptions, _environment);
        var usersPath = Path.Combine(rootPath, _userOptions.UsersFile);
        Directory.CreateDirectory(Path.GetDirectoryName(usersPath) ?? rootPath);

        await using var stream = File.Create(usersPath);
        await JsonSerializer.SerializeAsync(stream, users, _serializerOptions, cancellationToken);
    }
}
