using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Persistence.Configurations.Categories
{
    public sealed class ExecutorCategoryConfiguration : IEntityTypeConfiguration<ExecutorCategory>
    {
        public void Configure(EntityTypeBuilder<ExecutorCategory> b)
        {
            b.ToTable("ExecutorCategories");

            b.HasKey(x => new { x.UserId, x.CategoryId });

            b.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.Category)
                .WithMany()
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(x => new { x.CategoryId, x.UserId });
        }
    }
}
