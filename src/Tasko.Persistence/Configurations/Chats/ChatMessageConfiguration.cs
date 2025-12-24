using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tasko.Domain.Entities.Chats;

namespace Tasko.Persistence.Configurations.Chats;

public sealed class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> e)
    {
        e.ToTable("ChatMessages");

        e.HasKey(x => x.Id);
        e.Property(x => x.Id).ValueGeneratedOnAdd();

        e.Property(x => x.Text).HasMaxLength(2000).IsRequired();
        e.Property(x => x.CreatedAtUtc).IsRequired();

        e.HasIndex(x => x.TaskId);
        e.HasIndex(x => new { x.TaskId, x.CreatedAtUtc });
    }
}
