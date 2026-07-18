using Bll.Interfaces;
using DataAccessLayer.ModelContetxt;
using System;
using System.Collections.Generic;
using System.Text;

namespace Bll.Repositories
{
    public class ReviewRepository : GenericRepository<Review>, IReviewRepository
    {
        public ReviewRepository(AppContext context) : base(context) { }

        public IEnumerable<Review> GetReviewsByProperty(int propertyId)
            => _dbSet.Where(r => r.ReviewdProperty.ProperyID == propertyId).ToList();

        public IEnumerable<Review> GetReviewsByTenant(int tenantId)
            => _dbSet.Where(r => r.Reiewer.UsserId == tenantId).ToList();
    }
}
