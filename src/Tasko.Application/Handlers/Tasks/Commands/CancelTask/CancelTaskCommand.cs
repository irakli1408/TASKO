using MediatR;

namespace Tasko.Application.Handlers.Tasks.Commands.CancelTask;

public sealed record CancelTaskCommand(long TaskId) : IRequest;
