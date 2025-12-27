namespace Tasko.Application.Abstractions.Services;

public interface ITaskViewService
{
    /// <summary>
    /// Returns true if a NEW unique view was recorded, otherwise false.
    /// </summary>
    Task<bool> TrackTaskViewAsync(long taskId, long viewerUserId, CancellationToken ct);
}
