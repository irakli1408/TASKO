using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tasko.Domain.Entities.Tasks;

namespace Tasko.Persistence.Configurations.Tasks;

public sealed class TaskViewConfiguration : IEntityTypeConfiguration<TaskView>
{
    public void Configure(EntityTypeBuilder<TaskView> e)
    {
        e.ToTable("TaskViews");

        e.HasKey(x => x.Id);
        e.Property(x => x.Id).ValueGeneratedOnAdd();

        e.Property(x => x.ViewedAtUtc)
            .IsRequired();

        e.HasOne(x => x.Task)
            .WithMany()
            .HasForeignKey(x => x.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        // Один мастер = один просмотр таска (уникально)
        e.HasIndex(x => new { x.TaskId, x.ViewerUserId })
            .IsUnique();

        e.HasIndex(x => x.TaskId);
        e.HasIndex(x => x.ViewedAtUtc);
    }
}
