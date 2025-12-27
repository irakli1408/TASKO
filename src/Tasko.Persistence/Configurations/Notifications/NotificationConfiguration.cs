using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tasko.Domain.Entities.Notifications;

namespace Tasko.Persistence.Configurations.Notifications;

public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> b)
    {
        b.ToTable("Notifications");

        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedOnAdd();

        b.Property(x => x.Title).HasMaxLength(200).IsRequired();
        b.Property(x => x.Body).HasMaxLength(1000).IsRequired();
        b.Property(x => x.DataJson).HasMaxLength(4000);

        b.Property(x => x.Type).IsRequired();
        b.Property(x => x.UserId).IsRequired();

        b.Property(x => x.IsRead).HasDefaultValue(false);
        b.Property(x => x.CreatedAtUtc).IsRequired();

        b.HasIndex(x => new { x.UserId, x.IsRead, x.CreatedAtUtc });
    }
}
