using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tasko.Domain.Entities.Media;

namespace Tasko.Persistence.Configurations.Media;

public sealed class MediaFileConfiguration : IEntityTypeConfiguration<MediaFile>
{
    public void Configure(EntityTypeBuilder<MediaFile> e)
    {
        e.ToTable("Files");

        e.HasKey(x => x.Id);
        e.Property(x => x.Id).ValueGeneratedOnAdd();

        e.Property(x => x.CreatedByUserId).IsRequired();
        e.Property(x => x.Kind).HasConversion<int>().IsRequired();

        e.Property(x => x.OriginalName).HasMaxLength(260).IsRequired();
        e.Property(x => x.ContentType).HasMaxLength(100).IsRequired();

        e.Property(x => x.SizeBytes).IsRequired();

        e.Property(x => x.StoragePath).HasMaxLength(500).IsRequired();
        e.Property(x => x.CreatedAtUtc).IsRequired();

        e.HasIndex(x => x.CreatedByUserId);
        e.HasIndex(x => x.CreatedAtUtc);
    }
}
