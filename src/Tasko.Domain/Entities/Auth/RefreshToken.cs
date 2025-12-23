namespace Tasko.Domain.Entities.Auth
{
    public sealed class RefreshToken
    {
        private RefreshToken() { }

        public RefreshToken(long userId, string tokenHash, DateTime expiresAtUtc)
        {
            UserId = userId;
            TokenHash = tokenHash;
            ExpiresAtUtc = expiresAtUtc;
            CreatedAtUtc = DateTime.UtcNow;
        }

        public long Id { get; private set; }
        public long UserId { get; private set; }

        public string TokenHash { get; private set; } = null!;
        public DateTime CreatedAtUtc { get; private set; }
        public DateTime ExpiresAtUtc { get; private set; }

        public DateTime? RevokedAtUtc { get; private set; }
        public bool IsRevoked => RevokedAtUtc != null;

        public void Revoke() => RevokedAtUtc = DateTime.UtcNow;
    }
}
