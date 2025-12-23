using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Text;
using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Persistence.Configurations.Accoutns.Users
{
    public sealed class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> e)
        {
            e.ToTable("Users");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).ValueGeneratedOnAdd();

            e.Property(x => x.Email).HasMaxLength(256).IsRequired();
            e.Property(x => x.PasswordHash).IsRequired();

            e.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
            e.Property(x => x.LastName).HasMaxLength(100).IsRequired();
            e.Property(x => x.Phone).HasMaxLength(30).IsRequired();

            e.Property(x => x.AvatarUrl).HasMaxLength(1000);
            e.Property(x => x.About).HasMaxLength(1000);

            e.Property(x => x.RoleType).IsRequired();
            e.Property(x => x.LocationType).IsRequired();

            e.HasIndex(x => x.Email).IsUnique();
            e.HasIndex(x => x.Phone).IsUnique(); // удобно для реального сервиса
        }
    }
}
