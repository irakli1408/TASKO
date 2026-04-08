using System;
using System.Collections.Generic;
using System.Text;
using Tasko.Domain.Entities.Accounts.Users;

namespace Tasko.Domain.Entities.Notifications
{
    public sealed class NotificationPreference
    {
        private NotificationPreference() { }

        public NotificationPreference(long userId)
        {
            UserId = userId;
            NotifyNewOffers = true;
            NotifyTaskAssigned = true;
            NotifyNewMessages = true;
            NotifyTaskCompleted = true;
            NotifyMarketplaceUpdates = true;
        }

        public long UserId { get; private set; }
        public User User { get; private set; } = null!;

        public bool NotifyNewOffers { get; private set; }
        public bool NotifyTaskAssigned { get; private set; }
        public bool NotifyNewMessages { get; private set; }
        public bool NotifyTaskCompleted { get; private set; }
        public bool NotifyMarketplaceUpdates { get; private set; }

        public void Update(
            bool notifyNewOffers,
            bool notifyTaskAssigned,
            bool notifyNewMessages,
            bool notifyTaskCompleted,
            bool notifyMarketplaceUpdates)
        {
            NotifyNewOffers = notifyNewOffers;
            NotifyTaskAssigned = notifyTaskAssigned;
            NotifyNewMessages = notifyNewMessages;
            NotifyTaskCompleted = notifyTaskCompleted;
            NotifyMarketplaceUpdates = notifyMarketplaceUpdates;
        }
    }
}