using DataAccessLayer.Classes;
using System;
using System.Collections.Generic;
using System.Text;

namespace Bll.Interfaces
{
    public interface IUserRepository : IGenericRepository<User>
    {
        User? GetByEmail(string email);
        User? GetByPhone(string phoneNumber);
        bool CheckPassword(string email, string password);
    }
}
