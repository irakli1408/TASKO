using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tasko.Domain.Entities.Accounts.Users;
using Tasko.Domain.Entities.Auth;

namespace Tasko.Persistence.Configurations.Auth
{
    public sealed class PasswordResetTokenConfiguration : IEntityTypeConfiguration<PasswordResetToken>
    {
        public void Configure(EntityTypeBuilder<PasswordResetToken> e)
        {
            e.ToTable("PasswordResetTokens");

            e.HasKey(x => x.Id);
            e.Property(x => x.Id).ValueGeneratedOnAdd();

            e.Property(x => x.UserId).IsRequired();

            // SHA256 hex = 64, но оставим запас (если вдруг будет base64/другой формат)
            e.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();

            e.Property(x => x.ExpiresAtUtc).IsRequired();
            e.Property(x => x.CreatedAtUtc).IsRequired();

            e.Property(x => x.UsedAtUtc);

            e.Property(x => x.RequestedIp).HasMaxLength(45);
            e.Property(x => x.UserAgent).HasMaxLength(256);

            // reset по токену => быстрый поиск
            e.HasIndex(x => x.TokenHash).IsUnique();

            // удобно для cleanup/аудита
            e.HasIndex(x => new { x.UserId, x.CreatedAtUtc });

            e.HasOne<User>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
