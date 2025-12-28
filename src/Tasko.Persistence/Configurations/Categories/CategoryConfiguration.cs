using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tasko.Domain.Entities.Categories;

namespace Tasko.Persistence.Configurations.Categories
{
    public sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
    {
        public void Configure(EntityTypeBuilder<Category> b)
        {
            b.ToTable("Categories");

            b.HasKey(x => x.Id);

            b.Property(x => x.Name)
                .HasMaxLength(200)
                .IsRequired();

            b.Property(x => x.IsActive)
                .IsRequired();

            b.Property(x => x.CreatedAtUtc)
                .IsRequired();

            // hierarchy
            b.Property(x => x.ParentId)
                .IsRequired(false);

            b.HasOne(x => x.Parent)
                .WithMany(x => x.Children)
                .HasForeignKey(x => x.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(x => x.ParentId);
            b.HasIndex(x => x.Name);
            // optional uniqueness inside parent:
            // b.HasIndex(x => new { x.ParentId, x.Name }).IsUnique();
        }
    }
}