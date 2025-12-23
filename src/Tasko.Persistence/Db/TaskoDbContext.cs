using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Domain.Entities.Accounts.Users;
using Tasko.Domain.Entities.Auth;

public sealed class TaskoDbContext : DbContext, ITaskoDbContext
{
    public TaskoDbContext(DbContextOptions<TaskoDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TaskoDbContext).Assembly);
    }
}