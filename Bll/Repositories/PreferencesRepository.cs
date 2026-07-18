using Bll.Interfaces;
using DataAccessLayer;
using DataAccessLayer.ModelContetxt;

namespace Bll.Repositories
{
    public class PreferencesRepository : GenericRepository<Preferences>, IPreferencesRepository
    {
        public PreferencesRepository(AppContext context) : base(context) { }

        public Preferences? GetByTenantId(int tenantId)
            => _context.Set<Preferences>()
                       .FirstOrDefault(p => p.Tenant.UsserId == tenantId);

        public IEnumerable<Preferences> GetByPriceRange(int minPrice, int maxPrice)
            => _context.Set<Preferences>()
                       .Where(p => p.MinPrice >= minPrice && p.MaxPrice <= maxPrice)
                       .ToList();

        public IEnumerable<Preferences> GetByType(string type)
            => _context.Set<Preferences>()
                       .Where(p => p.Type == type)
                       .ToList();

        public IEnumerable<Preferences> GetBySoloOrShared(string soloOrShared)
            => _context.Set<Preferences>()
                       .Where(p => p.SoloOrShared == soloOrShared)
                       .ToList();
    }
}
