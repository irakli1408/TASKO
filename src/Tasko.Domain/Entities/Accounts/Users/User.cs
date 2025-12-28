namespace Tasko.Domain.Entities.Accounts.Users
{
    public enum UserRoleType
    {
        Customer = 1,
        Executor = 2,
        Both = 3
    }
    public enum LocationType
    {
        AllCity = 1,
        Center = 2,
        DistrictA = 3,
        DistrictB = 4
    }
    public sealed class User
    {
        private User() { }

        public User(string email, string passwordHash, string firstName, string lastName, string phone)
        {
            Email = email;
            PasswordHash = passwordHash;
            FirstName = firstName;
            LastName = lastName;
            Phone = phone;

            RoleType = UserRoleType.Customer;
            IsExecutorActive = false;
            LocationType = LocationType.AllCity;

            IsActive = true;
            CreatedAtUtc = DateTime.UtcNow;
        }

        public long Id { get; private set; }

        // Auth
        public string Email { get; private set; } = null!;
        public string PasswordHash { get; private set; } = null!;
        public bool IsActive { get; private set; }

        // Profile
        public string FirstName { get; private set; } = null!;
        public string LastName { get; private set; } = null!;
        public string Phone { get; private set; } = null!;
        public string? AvatarUrl { get; private set; }
        public string? About { get; private set; }

        // Business roles
        public UserRoleType RoleType { get; private set; }
        public bool IsExecutorActive { get; private set; }

        // Location (enum)
        public LocationType LocationType { get; private set; }

        // Rating (агрегаты)
        public double RatingAverage { get; private set; }
        public int RatingCount { get; private set; }

        // Time
        public DateTime CreatedAtUtc { get; private set; }
        public DateTime? LastOnlineAtUtc { get; private set; }

        public int? ExperienceYears { get; private set; }

        public void UpdateExecutorProfile(int? experienceYears)
        {
            ExperienceYears = experienceYears;
        }
        public void UpdateLastOnline() => LastOnlineAtUtc = DateTime.UtcNow;

        public void UpdateProfile(string firstName, string lastName, string phone, string? about)
        {
            FirstName = firstName;
            LastName = lastName;
            Phone = phone;
            About = about;
        }

        public void SetAvatar(string avatarUrl) => AvatarUrl = avatarUrl;

        public void BecomeExecutor(LocationType location)
        {
            RoleType = RoleType switch
            {
                UserRoleType.Customer => UserRoleType.Both,
                UserRoleType.Executor => UserRoleType.Executor,
                _ => UserRoleType.Both
            };

            LocationType = location;
            IsExecutorActive = true;
        }
        public void SetExecutorActive(bool isActive)
        {
            // Нельзя включить мастера, если пользователь вообще не имеет роли мастера
            if (isActive && RoleType is UserRoleType.Customer)
                throw new InvalidOperationException("User is not an executor.");

            IsExecutorActive = isActive;
        }
        public void DisableExecutor() => SetExecutorActive(false);

        public void UpdateLocation(LocationType location) => LocationType = location;

        public void AddRating(int rate)
        {
            if (rate is < 1 or > 5) throw new ArgumentOutOfRangeException(nameof(rate));
            RatingAverage = ((RatingAverage * RatingCount) + rate) / (++RatingCount);
        }

        public void Deactivate() => IsActive = false;
    }
}
