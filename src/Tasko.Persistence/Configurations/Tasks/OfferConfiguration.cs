using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tasko.Domain.Entities.Tasks;

namespace Tasko.Persistence.Configurations.Tasks;

public sealed class OfferConfiguration : IEntityTypeConfiguration<Offer>
{
    public void Configure(EntityTypeBuilder<Offer> e)
    {
        e.ToTable("Offers");

        e.HasKey(x => x.Id);
        e.Property(x => x.Id).ValueGeneratedOnAdd();

        e.Property(x => x.Price).HasColumnType("decimal(18,2)").IsRequired();
        e.Property(x => x.Comment).HasMaxLength(2000);

        e.Property(x => x.Status).IsRequired();
        e.Property(x => x.CreatedAtUtc).IsRequired();

        e.HasIndex(x => x.TaskId);
        e.HasIndex(x => x.ExecutorUserId);

        // 1 offer per executor per task
        e.HasIndex(x => new { x.TaskId, x.ExecutorUserId }).IsUnique();
    }
}
