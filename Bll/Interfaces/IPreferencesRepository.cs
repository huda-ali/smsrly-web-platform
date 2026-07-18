using DataAccessLayer.ModelContetxt;

namespace Bll.Interfaces
{
    public interface IPreferencesRepository : IGenericRepository<Preferences>
    {
        Preferences? GetByTenantId(int tenantId);
        IEnumerable<Preferences> GetByPriceRange(int minPrice, int maxPrice);
        IEnumerable<Preferences> GetByType(string type);
        IEnumerable<Preferences> GetBySoloOrShared(string soloOrShared);
    }
}