using DataAccessLayer.Classes;
using System;
using System.Collections.Generic;
using System.Text;

namespace Bll.Interfaces
{
    public interface IMessageRepository : IGenericRepository<Message>
    {
        IEnumerable<Message> GetMessagesBetween(int ownerId, int tenantId);
        IEnumerable<Message> GetUnreadMessages(int ownerId, int tenantId);
        void MarkAsRead(int messageId);
    }
}
