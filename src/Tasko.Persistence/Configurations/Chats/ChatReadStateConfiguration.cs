using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tasko.Domain.Entities.Chats;

namespace Tasko.Persistence.Configurations.Chats;

public sealed class ChatReadStateConfiguration : IEntityTypeConfiguration<ChatReadState>
{
    public void Configure(EntityTypeBuilder<ChatReadState> b)
    {
        b.ToTable("ChatReadStates");

        b.HasKey(x => x.Id);

        b.Property(x => x.TaskId).IsRequired();
        b.Property(x => x.UserId).IsRequired();
        b.Property(x => x.LastReadMessageId).IsRequired();
        b.Property(x => x.ReadAtUtc).IsRequired();

        b.HasIndex(x => new { x.TaskId, x.UserId }).IsUnique();
        b.HasIndex(x => new { x.UserId, x.TaskId });
    }
}
