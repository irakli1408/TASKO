using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Domain.Entities.Accounts.Users;
using Tasko.Domain.Entities.Auth;
using Tasko.Domain.Entities.Categories;
using Tasko.Domain.Entities.Chats;
using Tasko.Domain.Entities.Notifications;
using Tasko.Domain.Entities.Tasks;

public sealed class TaskoDbContext : DbContext, ITaskoDbContext
{
    public TaskoDbContext(DbContextOptions<TaskoDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<TaskPost> Tasks => Set<TaskPost>();
    public DbSet<Offer> Offers => Set<Offer>();


    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>(); 
    public DbSet<ChatReadState> ChatReadStates => Set<ChatReadState>();

    public DbSet<TaskView> TaskViews => Set<TaskView>();

    public DbSet<Notification> Notifications => Set<Notification>();

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<ExecutorCategory> ExecutorCategories => Set<ExecutorCategory>();


    public DbSet<ExecutorLocation> ExecutorLocations => Set<ExecutorLocation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TaskoDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}

