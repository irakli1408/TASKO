namespace Tasko.Common.ErrorHandler.Exceptions;

public sealed class UnauthorizedException : Exception
{
    public UnauthorizedException(string message = "Unauthorized") : base(message) { }
}
