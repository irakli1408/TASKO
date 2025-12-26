using MediatR;
using Tasko.Application.DTO.Chats;

namespace Tasko.Application.Handlers.Chats.Commands.SendTaskMessage
{
    public sealed record SendTaskMessageCommand(long TaskId, string Text) : IRequest<ChatMessageDto>;
}
