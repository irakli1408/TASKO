using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tasko.Domain.Entities.Accounts.Users;
using Tasko.Domain.Entities.Tasks;

namespace Tasko.Persistence.Configurations.Tasks;

public sealed class TaskPostConfiguration : IEntityTypeConfiguration<TaskPost>
{
    public void Configure(EntityTypeBuilder<TaskPost> e)
    {
        e.ToTable("Tasks");

        e.HasKey(x => x.Id);
        e.Property(x => x.Id).ValueGeneratedOnAdd();

        e.Property(x => x.Title).HasMaxLength(200).IsRequired();
        e.Property(x => x.Description).HasMaxLength(4000);
        e.Property(x => x.Budget).HasColumnType("decimal(18,2)");

        e.Property(x => x.Status).IsRequired();
        e.Property(x => x.CreatedAtUtc).IsRequired();

        e.Property(x => x.ViewsCount).HasDefaultValue(0);

        e.Property(x => x.CategoryId)
          .IsRequired();
        e.Property(x => x.LocationType)
        .HasConversion<int>()
        .HasDefaultValue(LocationType.AllCity)
        .IsRequired();

        e.HasOne(x => x.Category)
        .WithMany()
        .HasForeignKey(x => x.CategoryId)
        .OnDelete(DeleteBehavior.Restrict);

        e.HasIndex(x => x.CategoryId);
        e.HasIndex(x => x.CreatedByUserId);
        e.HasIndex(x => x.AssignedToUserId);
        e.HasIndex(x => x.Status);
    }
}
