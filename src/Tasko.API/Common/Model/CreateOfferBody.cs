namespace Tasko.API.Common.Model
{
    public sealed class CreateOfferBody
    {
        public decimal Price { get; init; }
        public string? Comment { get; init; }
    }
}
