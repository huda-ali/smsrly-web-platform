using Bll.Interfaces;
using DataAccessLayer.Classes;
using DataAccessLayer.ModelContetxt;
using System;
using System.Collections.Generic;
using System.Text;

namespace Bll.Repositories
{
    public class PropertyRepository : GenericRepository<Property>, IPropertyRepository
    {
        public PropertyRepository(AppContext context) : base(context) { }

        public IEnumerable<Property> GetByPriceRange(int minPrice, int maxPrice)
            => _dbSet.Where(p => p.RentPrice >= minPrice && p.RentPrice <= maxPrice)
                     .ToList();

        public IEnumerable<Property> GetByRooms(int numberOfRooms)
            => _dbSet.Where(p => p.NumberOFRooms == numberOfRooms).ToList();

        public IEnumerable<Review> GetPropertyReviews(int propertyId)
            => _context.Set<Review>()
                       .Where(r => r.ReviewdProperty.ProperyID == propertyId)
                       .ToList();

        public IEnumerable<Service> GetPropertyServices(int propertyId)
            => _dbSet.Where(p => p.ProperyID == propertyId)
                     .SelectMany(p => p.Services)
                     .ToList();
    }
}
