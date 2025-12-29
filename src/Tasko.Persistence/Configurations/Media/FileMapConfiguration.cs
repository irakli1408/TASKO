using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tasko.Domain.Entities.Media;

namespace Tasko.Persistence.Configurations.Media;

public sealed class FileMapConfiguration : IEntityTypeConfiguration<FileMap>
{
    public void Configure(EntityTypeBuilder<FileMap> e)
    {
        e.ToTable("FileMaps");

        e.HasKey(x => x.Id);
        e.Property(x => x.Id).ValueGeneratedOnAdd();

        e.Property(x => x.OwnerType).HasConversion<int>().IsRequired();
        e.Property(x => x.OwnerId).IsRequired();

        e.Property(x => x.SortOrder).HasDefaultValue(0).IsRequired();
        e.Property(x => x.CreatedAtUtc).IsRequired();

        e.HasOne(x => x.File)
            .WithMany()
            .HasForeignKey(x => x.FileId)
            .OnDelete(DeleteBehavior.Restrict);

        e.HasIndex(x => new { x.OwnerType, x.OwnerId });
        e.HasIndex(x => x.FileId);
    }
}
