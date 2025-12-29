using Tasko.Application.Abstractions.Services;

namespace Tasko.API.Services.Media;

public sealed class LocalFileStorage : IFileStorage
{
    private readonly IWebHostEnvironment _env;

    public LocalFileStorage(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<string> SaveAsync(string relativeFolder, string fileName, Stream content, CancellationToken ct)
    {
        // relativeFolder: "uploads/tasks/12"
        var folder = relativeFolder.Replace("\\", "/").Trim('/');
        var relPath = $"{folder}/{fileName}";

        var physicalFolder = Path.Combine(_env.WebRootPath ?? "wwwroot", folder.Replace("/", Path.DirectorySeparatorChar.ToString()));
        Directory.CreateDirectory(physicalFolder);

        var physicalPath = Path.Combine(physicalFolder, fileName);

        await using var fs = new FileStream(physicalPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true);
        await content.CopyToAsync(fs, ct);

        return relPath;
    }

    public Task DeleteAsync(string storagePath, CancellationToken ct)
    {
        var rel = storagePath.Replace("\\", "/").TrimStart('/');
        var physicalPath = Path.Combine(_env.WebRootPath ?? "wwwroot", rel.Replace("/", Path.DirectorySeparatorChar.ToString()));

        if (File.Exists(physicalPath))
            File.Delete(physicalPath);

        return Task.CompletedTask;
    }
}
