using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Tasko.Application.Abstractions.Auth;
using Tasko.Persistence.Auth;

public sealed class TokenService : ITokenService
{
    private readonly JwtOptions _opt;
    private readonly SymmetricSecurityKey _key;

    public TokenService(IOptions<JwtOptions> opt)
    {
        _opt = opt.Value;
        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opt.Key));
    }

    public (string Token, DateTime ExpiresAtUtc) CreateAccessToken(long userId, string email)
    {
        var now = DateTime.UtcNow;
        var exp = now.AddMinutes(_opt.AccessTokenMinutes);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Name, email),
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
        };

        var jwt = new JwtSecurityToken(
            issuer: _opt.Issuer,
            audience: _opt.Audience,
            claims: claims,
            notBefore: now,
            expires: exp,
            signingCredentials: new SigningCredentials(_key, SecurityAlgorithms.HmacSha256));

        return (new JwtSecurityTokenHandler().WriteToken(jwt), exp);
    }

    public (string Token, string TokenHash, DateTime ExpiresAtUtc) CreateRefreshToken()
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var hash = HashRefreshToken(token);
        var exp = DateTime.UtcNow.AddDays(_opt.RefreshTokenDays);
        return (token, hash, exp);
    }

    public string HashRefreshToken(string token)
    {
        using var sha = SHA256.Create();
        return Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes(token)));
    }
}