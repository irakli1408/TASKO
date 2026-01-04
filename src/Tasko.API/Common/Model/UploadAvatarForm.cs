namespace Tasko.API.Common.Model
{
    public sealed class UploadAvatarForm
    {
        public IFormFile File { get; init; } = null!;
    }
}
