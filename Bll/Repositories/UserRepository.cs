using Bll.Interfaces;
using DataAccessLayer.Classes;
using System;
using System.Collections.Generic;
using System.Text;

namespace Bll.Repositories
{
    public class UserRepository : GenericRepository<User>, IUserRepository
    {
        public UserRepository(AppContext context) : base(context) { }

        public User? GetByEmail(string email)
            => _dbSet.FirstOrDefault(u => u.Email == email && !u.IsDeleted);

        public User? GetByPhone(string phoneNumber)
            => _dbSet.FirstOrDefault(u => u.PhoneNumber == phoneNumber && !u.IsDeleted);

        public bool CheckPassword(string email, string password)
            => _dbSet.Any(u => u.Email == email && u.Password == password && !u.IsDeleted);
    }
}
