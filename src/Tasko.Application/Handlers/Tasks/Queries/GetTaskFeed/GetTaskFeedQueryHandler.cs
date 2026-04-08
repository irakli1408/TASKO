using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text.RegularExpressions;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Tasks;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Accounts.Users;
using Tasko.Domain.Entities.Tasks;

namespace Tasko.Application.Handlers.Tasks.Queries.GetTaskFeed;

public sealed class GetTaskFeedQueryHandler
    : IRequestHandler<GetTaskFeedQuery, IReadOnlyList<TaskFeedItemDto>>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public GetTaskFeedQueryHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<IReadOnlyList<TaskFeedItemDto>> Handle(GetTaskFeedQuery request, CancellationToken ct)
    {
        if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
        if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

        var skip = request.Skip < 0 ? 0 : request.Skip;
        var take = request.Take is < 1 or > 200 ? 50 : request.Take;

        var canUseFeed = await _db.Users.AsNoTracking()
            .AnyAsync(u => u.Id == userId
                           && u.IsActive
                           && u.IsExecutorActive
                           && (u.RoleType == UserRoleType.Executor || u.RoleType == UserRoleType.Both), ct);

        if (!canUseFeed)
            throw new UnauthorizedAccessException("Only active executors can use feed.");

        var q =
            from t in _db.Tasks.AsNoTracking()
            join ec in _db.ExecutorCategories.AsNoTracking()
                on new { CatId = t.CategoryId, UserId = userId }
                equals new { CatId = ec.CategoryId, UserId = ec.UserId }
            where t.Status == Tasko.Domain.Entities.Tasks.TaskStatus.Published
                  && t.CreatedByUserId != userId
            select t;

        if (request.LocationType is not null)
        {
            var loc = request.LocationType.Value;

            if (loc == LocationType.AllCity)
                q = q.Where(t => t.LocationType == LocationType.AllCity);
            else
                q = q.Where(t => t.LocationType == loc);
        }

        var candidates = await q
            .OrderByDescending(x => x.PublishedAtUtc ?? x.CreatedAtUtc)
            .Join(
                _db.Users.AsNoTracking(),
                task => task.CreatedByUserId,
                user => user.Id,
                (task, user) => new TaskFeedItemDto
                {
                    Id = task.Id,
                    CreatedByUserId = task.CreatedByUserId,
                    CreatedByFirstName = user.FirstName,
                    CreatedByLastName = user.LastName,
                    Title = task.Title,
                    Description = task.Description,
                    Budget = task.Budget,
                    PreferredTime = task.PreferredTime,
                    CategoryId = task.CategoryId,
                    LocationType = task.LocationType,
                    CreatedAtUtc = task.CreatedAtUtc,
                    PublishedAtUtc = task.PublishedAtUtc
                })
            .ToListAsync(ct);

        var nowLocal = ConvertToTbilisi(DateTime.UtcNow);

        var items = candidates
            .Where(x => !IsExpiredByPreferredTime(x.PreferredTime, x.PublishedAtUtc ?? x.CreatedAtUtc, nowLocal))
            .Skip(skip)
            .Take(take)
            .ToList();

        return items;
    }

    private static bool IsExpiredByPreferredTime(string? preferredTime, DateTime referenceUtc, DateTime nowLocal)
    {
        if (!TryExtractTime(preferredTime, out var scheduledTime))
        {
            return false;
        }

        var referenceLocal = ConvertToTbilisi(referenceUtc);
        var deadline = referenceLocal.Date.Add(scheduledTime).AddHours(3);

        return nowLocal > deadline;
    }

    private static bool TryExtractTime(string? input, out TimeSpan time)
    {
        time = default;

        if (string.IsNullOrWhiteSpace(input))
        {
            return false;
        }

        var normalized = input.Trim();
        var match = Regex.Match(normalized, @"(?<!\d)(?<hour>\d{1,2})[:.](?<minute>\d{2})(?!\d)");

        if (!match.Success)
        {
            return false;
        }

        var candidate = $"{match.Groups["hour"].Value}:{match.Groups["minute"].Value}";

        return TimeSpan.TryParseExact(candidate, @"h\:mm", CultureInfo.InvariantCulture, out time)
               || TimeSpan.TryParseExact(candidate, @"hh\:mm", CultureInfo.InvariantCulture, out time);
    }

    private static DateTime ConvertToTbilisi(DateTime utc)
    {
        try
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById("Georgian Standard Time");
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), tz);
        }
        catch (TimeZoneNotFoundException)
        {
            return DateTime.SpecifyKind(utc, DateTimeKind.Utc).AddHours(4);
        }
        catch (InvalidTimeZoneException)
        {
            return DateTime.SpecifyKind(utc, DateTimeKind.Utc).AddHours(4);
        }
    }
}
