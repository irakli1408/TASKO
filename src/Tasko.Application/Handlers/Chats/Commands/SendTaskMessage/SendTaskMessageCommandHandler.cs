using MediatR;
using Microsoft.EntityFrameworkCore;
using Tasko.Application.Abstractions.Persistence;
using Tasko.Application.Abstractions.Realtime;
using Tasko.Application.DTO.Chats;
using Tasko.Common.CurrentState;
using Tasko.Domain.Entities.Chats;

namespace Tasko.Application.Handlers.Chats.Commands.SendTaskMessage
{
    public sealed class SendTaskMessageCommandHandler : IRequestHandler<SendTaskMessageCommand, ChatMessageDto>
    {
        private readonly ITaskoDbContext _db;
        private readonly ICurrentStateService _current;
        private readonly IChatRealtime _realtime;

        public SendTaskMessageCommandHandler(ITaskoDbContext db, ICurrentStateService current, IChatRealtime realtime)
        {
            _db = db;
            _current = current;
            _realtime = realtime;
        }

        public async Task<ChatMessageDto> Handle(SendTaskMessageCommand request, CancellationToken ct)
        {
            if (!_current.IsAuthenticated) throw new UnauthorizedAccessException();
            if (!long.TryParse(_current.UserId, out var userId)) throw new UnauthorizedAccessException();

            var text = (request.Text ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(text))
                throw new InvalidOperationException("Message text is empty.");

            var task = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(x => x.Id == request.TaskId, ct)
                ?? throw new KeyNotFoundException("Task not found.");

            var isCreator = task.CreatedByUserId == userId;
            var isAssigned = task.AssignedToUserId == userId;
            var hasOffer = await _db.Offers.AsNoTracking()
                .AnyAsync(x => x.TaskId == request.TaskId && x.ExecutorUserId == userId, ct);

            if (!isCreator && !isAssigned && !hasOffer)
                throw new UnauthorizedAccessException("Access denied.");

            var msg = new ChatMessage(request.TaskId, userId, text);
            _db.ChatMessages.Add(msg);
            await _db.SaveChangesAsync(ct);

            var dto = new ChatMessageDto
            {
                Id = msg.Id,
                TaskId = msg.TaskId,
                SenderUserId = msg.SenderUserId,
                Text = msg.Text,
                CreatedAtUtc = msg.CreatedAtUtc
            };

            await _realtime.MessageReceived(request.TaskId, dto, ct);

            return dto;
        }
    }
}