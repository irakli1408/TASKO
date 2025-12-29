using MediatR;
using Tasko.Application.DTO.Media;

namespace Tasko.Application.Handlers.Tasks.Queries.GetTaskImages;

public sealed record GetTaskImagesQuery(long TaskId) : IRequest<IReadOnlyList<MediaFileDto>>;
