using DataAccessLayer.Classes;
using System;
using System.Collections.Generic;
using System.Text;

namespace Bll.Interfaces
{
    internal interface IServiceRepository
    {
        public interface IServiceRepository : IGenericRepository<Service>
        {
            IEnumerable<Service> GetByType(string serviceType);
            IEnumerable<Service> GetServicesByProperty(int propertyId);
        }
    }
}
