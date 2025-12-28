using System.Collections.Concurrent;
using Tasko.Application.Abstractions.Realtime;

namespace Tasko.API.Realtime;

public sealed class InMemoryChatPresence : IChatPresence
{
    private sealed class ConnectionState
    {
        public ConnectionState(long userId) => UserId = userId;
        public long UserId { get; }
        public ConcurrentDictionary<long, byte> TaskIds { get; } = new(); // set
    }

    private readonly record struct ChatKey(long UserId, long TaskId);

    private readonly ConcurrentDictionary<string, ConnectionState> _connections = new();
    private readonly ConcurrentDictionary<ChatKey, int> _counts = new();

    public void JoinTask(long userId, long taskId, string connectionId)
    {
        if (string.IsNullOrWhiteSpace(connectionId)) return;

        var state = _connections.GetOrAdd(connectionId, _ => new ConnectionState(userId));
        if (state.UserId != userId) return;

        if (!state.TaskIds.TryAdd(taskId, 0)) return;

        var key = new ChatKey(userId, taskId);
        _counts.AddOrUpdate(key, 1, (_, current) => current + 1);
    }

    public void LeaveTask(long userId, long taskId, string connectionId)
    {
        if (string.IsNullOrWhiteSpace(connectionId)) return;
        if (!_connections.TryGetValue(connectionId, out var state)) return;
        if (state.UserId != userId) return;

        if (!state.TaskIds.TryRemove(taskId, out _)) return;

        DecrementCount(userId, taskId);
    }

    public void Disconnect(string connectionId)
    {
        if (string.IsNullOrWhiteSpace(connectionId)) return;
        if (!_connections.TryRemove(connectionId, out var state)) return;

        foreach (var taskId in state.TaskIds.Keys)
            DecrementCount(state.UserId, taskId);
    }

    public bool IsInTaskChat(long userId, long taskId)
        => _counts.TryGetValue(new ChatKey(userId, taskId), out var c) && c > 0;

    private void DecrementCount(long userId, long taskId)
    {
        var key = new ChatKey(userId, taskId);

        while (true)
        {
            if (!_counts.TryGetValue(key, out var current))
                return;

            if (current <= 1)
            {
                _counts.TryRemove(key, out _);
                return;
            }

            if (_counts.TryUpdate(key, current - 1, current))
                return;
        }
    }
}
