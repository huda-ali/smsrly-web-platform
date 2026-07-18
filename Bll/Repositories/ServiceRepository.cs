using Bll.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;

namespace Bll.Repositories
{
    public class ServiceRepository : GenericRepository<Service>, IServiceRepository
    {
        public ServiceRepository(AppContext context) : base(context) { }

        public IEnumerable<Service> GetByType(string serviceType)
            => _dbSet.Where(s => s.ServiceType == serviceType).ToList();

        public IEnumerable<Service> GetServicesByProperty(int propertyId)
            => _dbSet.Where(s => s.Properties.Any(p => p.ProperyID == propertyId))
                     .ToList();
    }
}
