using MediatR;

namespace Tasko.Application.Handlers.Tasks.Commands.CompleteTask;

public sealed record CompleteTaskCommand(long TaskId) : IRequest;
