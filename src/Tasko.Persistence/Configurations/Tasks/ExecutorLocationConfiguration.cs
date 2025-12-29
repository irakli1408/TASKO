using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Persistence.Configurations.Tasks
{
    public sealed class ExecutorLocationConfiguration : IEntityTypeConfiguration<ExecutorLocation>
    {
        public void Configure(EntityTypeBuilder<ExecutorLocation> b)
        {
            b.ToTable("ExecutorLocations");

            b.HasKey(x => new { x.UserId, x.LocationType });

            b.Property(x => x.LocationType)
                .HasConversion<int>()
                .IsRequired();

            b.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(x => x.LocationType);
        }
    }
}
