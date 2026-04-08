using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tasko.Domain.Entities.Notifications;

namespace Tasko.Persistence.Configurations.Notifications
{
    public sealed class NotificationPreferenceConfiguration : IEntityTypeConfiguration<NotificationPreference>
    {
        public void Configure(EntityTypeBuilder<NotificationPreference> builder)
        {
            builder.ToTable("NotificationPreferences");

            builder.HasKey(x => x.UserId);

            builder.Property(x => x.NotifyNewOffers).IsRequired();
            builder.Property(x => x.NotifyTaskAssigned).IsRequired();
            builder.Property(x => x.NotifyNewMessages).IsRequired();
            builder.Property(x => x.NotifyTaskCompleted).IsRequired();
            builder.Property(x => x.NotifyMarketplaceUpdates).IsRequired();

            builder.HasOne(x => x.User)
                .WithOne()
                .HasForeignKey<NotificationPreference>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
