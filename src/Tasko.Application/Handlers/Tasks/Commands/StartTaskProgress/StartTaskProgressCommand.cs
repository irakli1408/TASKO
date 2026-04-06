using MediatR;

namespace Tasko.Application.Handlers.Tasks.Commands.StartTaskProgress;

public sealed record StartTaskProgressCommand(long TaskId) : IRequest;
