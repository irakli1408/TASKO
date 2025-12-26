using Microsoft.EntityFrameworkCore;
using Tasko.Domain.Entities.Accounts.Users;
using Tasko.Domain.Entities.Auth;
using Tasko.Domain.Entities.Chats;
using Tasko.Domain.Entities.Tasks;

namespace Tasko.Application.Abstractions.Persistence;

public interface ITaskoDbContext
{
     DbSet<User> Users { get; }
     DbSet<RefreshToken> RefreshTokens { get; }
     DbSet<TaskPost> Tasks { get; }
     DbSet<Offer> Offers { get; }


    DbSet<ChatMessage> ChatMessages { get; }
    DbSet<ChatReadState> ChatReadStates { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

