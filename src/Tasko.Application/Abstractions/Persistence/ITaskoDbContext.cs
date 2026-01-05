using Microsoft.EntityFrameworkCore;
using Tasko.Domain.Entities.Accounts.Users;
using Tasko.Domain.Entities.Auth;
using Tasko.Domain.Entities.Categories;
using Tasko.Domain.Entities.Chats;
using Tasko.Domain.Entities.Notifications;
using Tasko.Domain.Entities.Tasks;
using Tasko.Domain.Entities.Media;

namespace Tasko.Application.Abstractions.Persistence;

public interface ITaskoDbContext
{
     DbSet<User> Users { get; }
     DbSet<RefreshToken> RefreshTokens { get; }
     DbSet<TaskPost> Tasks { get; }
     DbSet<Offer> Offers { get; }


    DbSet<ChatMessage> ChatMessages { get; }
    DbSet<ChatReadState> ChatReadStates { get; }

    DbSet<TaskView> TaskViews { get; }

    DbSet<Notification> Notifications { get; }

    DbSet<Category> Categories { get; }
    DbSet<ExecutorCategory> ExecutorCategories { get; }
    DbSet<ExecutorLocation> ExecutorLocations { get; }

    DbSet<MediaFile> Files { get; }
    DbSet<FileMap> FileMaps { get; }

    DbSet<PasswordResetToken> PasswordResetTokens { get; }


    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}


