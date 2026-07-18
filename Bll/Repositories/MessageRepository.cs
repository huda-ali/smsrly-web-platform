using Bll.Interfaces;
using DataAccessLayer.Classes;
using System;
using System.Collections.Generic;
using System.Text;

namespace Bll.Repositories
{
    public class MessageRepository : GenericRepository<Message>, IMessageRepository
    {
        public MessageRepository(AppContext context) : base(context) { }

        public IEnumerable<Message> GetMessagesBetween(int ownerId, int tenantId)
            => _dbSet.Where(m => m.Owner.UsserId == ownerId
                              && m.tentant.UsserId == tenantId
                              && !m.Isdeleted)
                     .OrderBy(m => m.ReciveDate)
                     .ToList();

        public IEnumerable<Message> GetUnreadMessages(int ownerId, int tenantId)
            => _dbSet.Where(m => m.Owner.UsserId == ownerId
                              && m.tentant.UsserId == tenantId
                              && m.ReadDate == default
                              && !m.Isdeleted)
                     .ToList();

        public void MarkAsRead(int messageId)
        {
            var msg = _dbSet.Find(messageId);
            if (msg != null)
            {
                msg.ReadDate = DateTime.Now;
                _dbSet.Update(msg);
            }
        }
    }
}
