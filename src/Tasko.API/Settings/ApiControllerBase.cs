using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Tasko.API.Common.Model;

namespace Tasko.API.Settings
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route($"api/v{{version:apiVersion}}/{Routes.Culture}/[controller]")]
    public abstract class ApiControllerBase : ControllerBase
    {
        protected readonly ISender Sender;
        protected ApiControllerBase(ISender sender) => Sender = sender;
    }
}
