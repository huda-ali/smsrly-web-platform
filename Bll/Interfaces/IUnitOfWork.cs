using System;
using System.Collections.Generic;
using System.Text;

namespace Bll.Interfaces
{
    internal interface IUnitOfWork
    {
        
            IUserRepository Users { get; }
            IAdminRepository Admins { get; }
            IOwnerRepository Owners { get; }
            ITenantRepository Tenants { get; }
            IPropertyRepository Properties { get; }
            IMessageRepository Messages { get; }
            IReviewRepository Reviews { get; }
            IServiceRepository Services { get; }
           IPreferencesRepository Preferences { get; }

        int Complete();
        }
    
}
