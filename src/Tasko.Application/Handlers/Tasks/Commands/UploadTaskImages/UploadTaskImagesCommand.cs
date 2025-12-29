using MediatR;
using Tasko.Application.DTO.Media;
using Tasko.Application.Media;

namespace Tasko.Application.Handlers.Tasks.Commands.UploadTaskImages;

public sealed record UploadTaskImagesCommand(long TaskId, IReadOnlyList<UploadFile> Files)
    : IRequest<IReadOnlyList<MediaFileDto>>;
