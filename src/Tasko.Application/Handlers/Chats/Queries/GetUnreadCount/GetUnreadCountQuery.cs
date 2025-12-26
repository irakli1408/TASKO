using MediatR;
using Tasko.Application.DTO.Chats;

namespace Tasko.Application.Handlers.Chats.Queries.GetUnreadCount;

public sealed record GetUnreadCountQuery(long TaskId) : IRequest<UnreadCountDto>;
