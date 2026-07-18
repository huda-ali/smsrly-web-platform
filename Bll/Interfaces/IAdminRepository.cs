using DataAccessLayer.Classes;
using System;
using System.Collections.Generic;
using System.Text;

namespace Bll.Interfaces
{
    public interface IAdminRepository : IGenericRepository<Admin>
    {
        IEnumerable<User> GetAllUsers();
        IEnumerable<Property> GetAllProperties();
    }

}
