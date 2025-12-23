using Microsoft.EntityFrameworkCore;
using Tasko.Domain.Entities.Accounts.Users;
using Tasko.Domain.Entities.Auth;

namespace Tasko.Application.Abstractions.Persistence;

public interface ITaskoDbContext
{
     DbSet<User> Users { get; }
     DbSet<RefreshToken> RefreshTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
