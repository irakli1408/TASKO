namespace Tasko.Application.Abstractions.Services;

public interface IFileStorage
{
    /// <summary>
    /// Saves stream to storage and returns relative storage path (e.g. "uploads/tasks/12/abc.jpg")
    /// </summary>
    Task<string> SaveAsync(string relativeFolder, string fileName, Stream content, CancellationToken ct);

    Task DeleteAsync(string storagePath, CancellationToken ct);
}
