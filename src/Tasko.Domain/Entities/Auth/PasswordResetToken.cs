namespace Tasko.Domain.Entities.Auth
{
    public sealed class PasswordResetToken
    {
        public long Id { get; set; }

        public long UserId { get; set; }

        // Храним ТОЛЬКО hash (например SHA256 hex = 64 символа)
        public string TokenHash { get; set; } = default!;

        public DateTime ExpiresAtUtc { get; set; }
        public DateTime? UsedAtUtc { get; set; }

        public DateTime CreatedAtUtc { get; set; }

        public string? RequestedIp { get; set; }
        public string? UserAgent { get; set; }

        // Навигация (если у тебя User называется иначе — просто поменяй тип)
        public Tasko.Domain.Entities.Accounts.Users.User? User { get; set; }

        public bool IsActive(DateTime utcNow) => UsedAtUtc is null && ExpiresAtUtc > utcNow;

        public void MarkUsed(DateTime utcNow)
        {
            if (UsedAtUtc is null)
                UsedAtUtc = utcNow;
        }
    }
}
