using Bll.Interfaces;
using System.Collections.Generic;
using System.Reflection;
using DataAccessLayer;
using DataAccessLayer.Models;



namespace Bll.Repositories
{
    public class AdminRepository : GenericRepository<Admin>, IAdminRepository
    {
        private readonly AppContext context;

        public AdminRepository(AppContext context) : base(context)
        {
            this.context = context;
          
        }

        public IEnumerable<User> GetAllUsers()
            => _context.Set<User>().Where(u => !u.IsDeleted).ToList();

        public IEnumerable<Property> GetAllProperties()
            => _context.Set<Property>().ToList();

        public override bool Equals(object? obj)
        {
            return obj is AdminRepository repository &&
                   EqualityComparer<AppContext>.Default.Equals(context, repository.context);
        }
    }
}
