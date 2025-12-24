using MediatR;

namespace Tasko.Application.Handlers.Tasks.Commands.PublishTask;

public sealed record PublishTaskCommand(long TaskId) : IRequest;
