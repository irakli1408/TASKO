namespace Tasko.Application.Abstractions.Realtime;

/// <summary>
/// Tracks whether a user currently has a specific task chat opened (via SignalR Join/Leave).
/// Used to mute message notifications when the recipient is already inside the chat.
/// </summary>
public interface IChatPresence
{
    void JoinTask(long userId, long taskId, string connectionId);
    void LeaveTask(long userId, long taskId, string connectionId);
    void Disconnect(string connectionId);
    bool IsInTaskChat(long userId, long taskId);
}
