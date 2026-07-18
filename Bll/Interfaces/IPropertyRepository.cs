using DataAccessLayer.Classes;
using DataAccessLayer.ModelContetxt;
using System;
using System.Collections.Generic;
using System.Text;

namespace Bll.Interfaces
{
    public interface IPropertyRepository : IGenericRepository<Property>
    {
        IEnumerable<Property> GetByPriceRange(int minPrice, int maxPrice);
        IEnumerable<Property> GetByRooms(int numberOfRooms);
        IEnumerable<Review> GetPropertyReviews(int propertyId);
        IEnumerable<Service> GetPropertyServices(int propertyId);
    }
}
