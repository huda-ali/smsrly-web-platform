using BusinessLogicLayer.ML;

namespace BusinessLogicLayer.Interfaces
{
    public interface IMlApiClient
    {
        Task<MlRecommendationsResponse> GetRecommendationsAsync(Guid mlUserId, int topN = 10);
        Task<List<MlProperty>> GetSimilarPropertiesAsync(Guid propertyId, int topN = 10);
        Task RecordInteractionAsync(Guid mlUserId, Guid propertyId, string interactionType, double? rating = null);
        Task UpdatePreferencesAsync(Guid mlUserId, MlPreferencesRequest preferences);
        Task<MlScrapeStatusResponse> StartScrapeAsync(string siteName, string targetUrl, int maxPages = 5);
        Task TriggerTrainingAsync(string modelType = "all", bool forceRetrain = false);
        Task<MlScrapeStatusResponse> GetScrapeStatusAsync(Guid jobId);
    }

    public class MlPreferencesRequest
    {
        public List<string>? PreferredCities { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public int? MinBedrooms { get; set; }
    }
}