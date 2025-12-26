using MediatR;

namespace Tasko.Application.Handlers.Chats.Commands.MarkMessagesRead;

public sealed record MarkMessagesReadCommand(long TaskId, long LastReadMessageId) : IRequest;
