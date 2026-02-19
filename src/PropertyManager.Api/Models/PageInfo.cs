// PropertyManager.Api - models
namespace PropertyManager.Api.Models;

/// <summary>
/// Represents an ordered page entry.
/// </summary>
public sealed record PageInfo(string Id, int Order);
