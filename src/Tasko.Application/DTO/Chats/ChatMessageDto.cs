namespace Tasko.Application.DTO.Chats;

public sealed class ChatMessageDto
{
    public long Id { get; init; }
    public long TaskId { get; init; }
    public long SenderUserId { get; init; }
    public string Text { get; init; } = null!;
    public DateTime CreatedAtUtc { get; init; }
}
