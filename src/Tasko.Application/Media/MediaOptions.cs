namespace Tasko.Application.Media;

public sealed class MediaOptions
{
    public long MaxImageBytes { get; init; } = 10 * 1024 * 1024;

    public string[] AllowedImageExtensions { get; init; } =
        [".jpg", ".jpeg", ".png", ".webp"];

    public string[] AllowedImageContentTypes { get; init; } =
        ["image/jpeg", "image/png", "image/webp"];

    public int MaxTaskImages { get; init; } = 5;
    public int MaxAvatarImages { get; init; } = 1;
}
