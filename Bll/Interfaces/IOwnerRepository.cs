using DataAccessLayer.Classes;
using System;
using System.Collections.Generic;
using System.Text;

namespace Bll.Interfaces
{
    public interface IOwnerRepository : IGenericRepository<Owner>
    {
        IEnumerable<Property> GetOwnerProperties(int ownerId);
        IEnumerable<Message> GetOwnerMessages(int ownerId);
    }
}
