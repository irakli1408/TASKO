using MediatR;
using Tasko.Application.DTO.Chats;

namespace Tasko.Application.Handlers.Chats.Queries.GetTaskMessages;

public sealed record GetTaskMessagesQuery(long TaskId, int Skip = 0, int Take = 50) : IRequest<IReadOnlyList<ChatMessageDto>>;
