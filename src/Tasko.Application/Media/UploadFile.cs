namespace Tasko.Application.Media;

public sealed record UploadFile(
    Stream Content,
    string FileName,
    string ContentType,
    long Length
);
