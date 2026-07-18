using DataAccessLayer.Classes;
using DataAccessLayer.ModelContetxt;
using System;
using System.Collections.Generic;
using System.Text;

namespace Bll.Interfaces
{
    public interface ITenantRepository : IGenericRepository<Tenant>
    {
        IEnumerable<Review> GetTenantReviews(int tenantId);
        IEnumerable<Message> GetTenantMessages(int tenantId);
    }
}
