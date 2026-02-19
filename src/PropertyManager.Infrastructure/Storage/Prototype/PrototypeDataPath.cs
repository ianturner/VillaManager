// PropertyManager.Infrastructure - prototype data helpers
using System;
using System.IO;
using Microsoft.Extensions.Hosting;

namespace PropertyManager.Infrastructure.Storage.Prototype;

/// <summary>
/// Resolves prototype data paths and public URLs.
/// </summary>
public static class PrototypeDataPath
{
    /// <summary>
    /// Resolves the absolute root path for prototype data.
    /// </summary>
    public static string ResolveRootPath(PrototypeDataOptions options, IHostEnvironment environment)
    {
        return Path.IsPathRooted(options.RootPath)
            ? options.RootPath
            : Path.Combine(environment.ContentRootPath, options.RootPath);
    }

    /// <summary>
    /// Converts a file path to a public URL using the configured base path.
    /// </summary>
    public static string ToPublicUrl(string rootPath, string publicBasePath, string filePath)
    {
        var relative = Path.GetRelativePath(rootPath, filePath)
            .Replace(Path.DirectorySeparatorChar, '/');
        var basePath = publicBasePath.StartsWith('/')
            ? publicBasePath
            : "/" + publicBasePath;

        return $"{basePath}/{relative}";
    }
}
