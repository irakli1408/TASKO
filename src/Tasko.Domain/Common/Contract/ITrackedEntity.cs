namespace Tasko.Domain.Common.Contract
{
    public interface ITrackedEntity
    {
        string? CreatedBy { get; }
        DateTime CreateDate { get; }

        string? LastModifiedBy { get; }
        DateTime? LastModifiedDate { get; }

        string? DeletedBy { get; }
        DateTime? DeleteDate { get; }

        void Delete();
    }
}
