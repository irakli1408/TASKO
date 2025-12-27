using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Services;
using Tasko.Domain.Entities.Tasks;

namespace Tasko.Application.Services;

public sealed class TaskViewService : ITaskViewService
{
    private readonly ITaskoDbContext _db;

    public TaskViewService(ITaskoDbContext db)
    {
        _db = db;
    }

    public async Task<bool> TrackTaskViewAsync(long taskId, long viewerUserId, CancellationToken ct)
    {
        var task = await _db.Tasks
            .FirstOrDefaultAsync(x => x.Id == taskId, ct);

        if (task is null)
            return false;

        _db.TaskViews.Add(new TaskView(taskId, viewerUserId));
        task.IncrementViewsCount();

        try
        {
            await _db.SaveChangesAsync(ct);
            return true;
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            return false;
        }
    }

    private static bool IsUniqueViolation(DbUpdateException ex)
    {
        var msg = (ex.InnerException?.Message ?? ex.Message).ToLowerInvariant();

        return msg.Contains("2627")   // SQL Server unique constraint
            || msg.Contains("2601")
            || msg.Contains("23505")  // Postgres unique_violation
            || msg.Contains("duplicate")
            || msg.Contains("unique constraint");
    }
}
