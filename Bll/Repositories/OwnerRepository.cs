using Bll.Interfaces;
using DataAccessLayer.Classes;

using System.Collections.Generic;


namespace Bll.Repositories
{
    public class OwnerRepository : GenericRepository<Owner>, IOwnerRepository
    {
        public OwnerRepository(AppContext context) : base(context) { }

        public IEnumerable<Property> GetOwnerProperties(int ownerId)
            => _context.Set<Property>()
                       .Where(p => p.Owner.UsserId == ownerId)
                       .ToList();

        public IEnumerable<Message> GetOwnerMessages(int ownerId)
            => _context.Set<Message>()
                       .Where(m => m.Owner.UsserId == ownerId && !m.Isdeleted)
                       .ToList();
    }
}
