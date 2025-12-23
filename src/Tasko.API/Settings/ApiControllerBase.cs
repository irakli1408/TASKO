using MediatR;
using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;

namespace Tasko.API.Settings
{
    [ApiController]
    //[ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/{culture}/[controller]")]
    public abstract class ApiControllerBase : ControllerBase
    {
        protected readonly ISender Sender;
        protected ApiControllerBase(ISender sender) => Sender = sender;
    }
}
