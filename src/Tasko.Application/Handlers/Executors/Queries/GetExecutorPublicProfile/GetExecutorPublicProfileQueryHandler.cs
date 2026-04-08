using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.DTO.Executors;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Accounts.Users;
using Tasko.Domain.Entities.Tasks;

namespace Tasko.Application.Handlers.Executors.Queries.GetExecutorPublicProfile;

public sealed class GetExecutorPublicProfileQueryHandler
    : IRequestHandler<GetExecutorPublicProfileQuery, ExecutorPublicProfileDto>
{
    private readonly ITaskoDbContext _db;
    private readonly ICurrentStateService _current;

    public GetExecutorPublicProfileQueryHandler(ITaskoDbContext db, ICurrentStateService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<ExecutorPublicProfileDto> Handle(GetExecutorPublicProfileQuery request, CancellationToken ct)
    {
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.Id && x.IsActive, ct);

        if (user is null)
            throw new InvalidOperationException("Executor not found.");

        if (user.RoleType is not (UserRoleType.Executor or UserRoleType.Both))
            throw new InvalidOperationException("Executor not found.");

        var categoryIds = await _db.ExecutorCategories
            .AsNoTracking()
            .Where(x => x.UserId == user.Id)
            .Select(x => x.CategoryId)
            .OrderBy(x => x)
            .ToListAsync(ct);

        var phone = MaskPhone(user.Phone);

        if (_current.IsAuthenticated && long.TryParse(_current.UserId, out var currentUserId))
        {
            var hasCollaboration = currentUserId == user.Id || await _db.Tasks
                .AsNoTracking()
                .AnyAsync(
                    x => x.CreatedByUserId == currentUserId
                        && x.AssignedToUserId == user.Id
                        && (x.Status == Tasko.Domain.Entities.Tasks.TaskStatus.Assigned
                            || x.Status == Tasko.Domain.Entities.Tasks.TaskStatus.InProgress
                            || x.Status == Tasko.Domain.Entities.Tasks.TaskStatus.Completed),
                    ct);

            if (hasCollaboration)
            {
                phone = user.Phone;
            }
        }

        return new ExecutorPublicProfileDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Phone = phone,
            AvatarUrl = user.AvatarUrl,
            About = user.About,
            RatingAverage = user.RatingAverage,
            RatingCount = user.RatingCount,
            LocationType = user.LocationType,
            ExperienceYears = user.ExperienceYears,
            CategoryIds = categoryIds
        };
    }

    private static string MaskPhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
        {
            return string.Empty;
        }

        var chars = phone.ToCharArray();
        var digitsMasked = 0;

        for (var i = chars.Length - 1; i >= 0; i--)
        {
            if (!char.IsDigit(chars[i]))
            {
                continue;
            }

            if (digitsMasked < 4)
            {
                chars[i] = '*';
                digitsMasked++;
            }
        }

        return new string(chars);
    }
}
