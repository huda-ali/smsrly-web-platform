using Bll.Interfaces;
using DataAccessLayer.Classes;
using System;
using System.Collections.Generic;
using System.Text;

namespace Bll.Repositories
{
    public class TenantRepository : GenericRepository<Tenant>, ITenantRepository
    {
        public TenantRepository(AppContext context) : base(context) { }

        public IEnumerable<Review> GetTenantReviews(int tenantId)
            => _context.Set<Review>()
                       .Where(r => r.Reiewer.UsserId == tenantId)
                       .ToList();

        public IEnumerable<Message> GetTenantMessages(int tenantId)
            => _context.Set<Message>()
                       .Where(m => m.tentant.UsserId == tenantId && !m.Isdeleted)
                       .ToList();
    }
}
