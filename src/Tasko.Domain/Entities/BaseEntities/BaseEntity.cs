using System.ComponentModel.DataAnnotations;

namespace Tasko.Domain.Entities.BaseEntities
{
    public abstract class BaseEntity<T>
    {
        [Key]
        public T Id { get; set; } = default!;
    }

    public abstract class BaseEntity : BaseEntity<long> { }
}
