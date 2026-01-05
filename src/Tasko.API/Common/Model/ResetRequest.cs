namespace Tasko.API.Common.Model
{
    public sealed record ResetRequest(string Token, string NewPassword);
}
