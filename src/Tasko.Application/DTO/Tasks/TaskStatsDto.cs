namespace Tasko.Application.DTO.Tasks;

public sealed class TaskStatsDto
{
    public long TaskId { get; init; }

    // все отклики, кроме Withdrawn
    public int OffersCount { get; init; }

    // только Active (pending)
    public int ActiveOffersCount { get; init; }

    // Accepted (обычно 0 или 1)
    public int AcceptedOffersCount { get; init; }

    // добавим на этапе Views
    public int ViewsCount { get; init; }
}
