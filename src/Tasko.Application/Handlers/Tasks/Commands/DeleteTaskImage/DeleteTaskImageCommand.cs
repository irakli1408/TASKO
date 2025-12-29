using MediatR;

namespace Tasko.Application.Handlers.Tasks.Commands.DeleteTaskImage;

public sealed record DeleteTaskImageCommand(long TaskId, long FileId) : IRequest;
