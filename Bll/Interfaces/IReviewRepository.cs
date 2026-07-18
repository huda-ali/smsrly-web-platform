using DataAccessLayer.ModelContetxt;
using System;
using System.Collections.Generic;
using System.Text;

namespace Bll.Interfaces
{
    public interface IReviewRepository : IGenericRepository<Review>
    {
        IEnumerable<Review> GetReviewsByProperty(int propertyId);
        IEnumerable<Review> GetReviewsByTenant(int tenantId);
    }
}
