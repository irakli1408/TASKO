namespace Tasko.Application.Abstractions.Auth
{
    public static class Roles
    {
        public const string Customer = "Customer";
        public const string Executor = "Executor";
        public const string Admin = "Admin";

        public static readonly string[] All =
        {
        Customer,
        Executor,
        Admin
    };
    }
}
