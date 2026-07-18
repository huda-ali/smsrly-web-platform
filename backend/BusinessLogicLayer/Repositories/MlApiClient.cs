using System.Net.Http.Json;
using BusinessLogicLayer.Interfaces;
using BusinessLogicLayer.ML;

namespace BusinessLogicLayer.Repositories
{
    public class MlApiClient : IMlApiClient
    {
        private readonly HttpClient _http;

        public MlApiClient(HttpClient http)
        {
            _http = http;
        }

        public async Task<MlRecommendationsResponse> GetRecommendationsAsync(Guid mlUserId, int topN = 10)
        {
            var response = await _http.GetFromJsonAsync<MlRecommendationsResponse>(
                $"recommendations/{mlUserId}?top_n={topN}");

            return response ?? throw new InvalidOperationException("ML API returned no data");
        }

        public async Task<List<MlSimilarPropertyItem>> GetSimilarPropertiesAsync(Guid propertyId, int topN = 10)
        {
            var response = await _http.GetFromJsonAsync<MlSimilarPropertiesResponse>(
                $"similar-properties/{propertyId}?top_n={topN}");

            return response?.SimilarProperties ?? new List<MlSimilarPropertyItem>();
        }

        public async Task RecordInteractionAsync(Guid mlUserId, Guid propertyId, string interactionType, double? rating = null)
        {
            var payload = new
            {
                user_id = mlUserId,
                property_id = propertyId,
                interaction_type = interactionType,
                rating
            };

            var response = await _http.PostAsJsonAsync("interact", payload);
            response.EnsureSuccessStatusCode();
        }

        public async Task UpdatePreferencesAsync(Guid mlUserId, MlPreferencesRequest preferences)
        {
            var payload = new
            {
                preferred_cities = preferences.PreferredCities,
                min_price = preferences.MinPrice,
                max_price = preferences.MaxPrice,
                min_bedrooms = preferences.MinBedrooms
            };

            var response = await _http.PostAsJsonAsync($"user/preferences?user_id={mlUserId}", payload);
            response.EnsureSuccessStatusCode();
        }

        public async Task<MlScrapeStatusResponse> StartScrapeAsync(string siteName, string targetUrl, int maxPages = 5)
        {
            var payload = new { site_name = siteName, target_url = targetUrl, max_pages = maxPages };
            var response = await _http.PostAsJsonAsync("scrape", payload);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadFromJsonAsync<MlScrapeStatusResponse>()
                ?? throw new InvalidOperationException("ML API returned no data");
        }

        public async Task TriggerTrainingAsync(string modelType = "all", bool forceRetrain = false)
        {
            var payload = new { model_type = modelType, force_retrain = forceRetrain };
            var response = await _http.PostAsJsonAsync("train-model", payload);
            response.EnsureSuccessStatusCode();
        }
        
        public async Task<MlScrapeStatusResponse> GetScrapeStatusAsync(Guid jobId)
        {
            var response = await _http.GetFromJsonAsync<MlScrapeStatusResponse>($"scrape/status/{jobId}");
            return response ?? throw new InvalidOperationException("ML API returned no data");
        }
    }
}