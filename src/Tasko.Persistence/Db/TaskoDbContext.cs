using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Domain.Entities.Accounts.Users;
using Tasko.Domain.Entities.Auth;
using Tasko.Domain.Entities.Chats;
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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TaskoDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}

