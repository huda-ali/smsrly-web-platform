using System.Text.Json.Serialization;

namespace BusinessLogicLayer.ML
{
    public class MlProperty
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public decimal? Price { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public int? Bedrooms { get; set; }
        public int? Bathrooms { get; set; }
        public decimal? Area { get; set; }

        [JsonPropertyName("property_type")]
        public string? PropertyType { get; set; }

        public List<string>? Amenities { get; set; }
        public List<string>? Images { get; set; }

        [JsonPropertyName("is_featured")]
        public bool IsFeatured { get; set; }

        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; }
    }

    public class MlRecommendationItem
    {
        public MlProperty Property { get; set; } = null!;
        public double Score { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class MlRecommendationsResponse
    {
        [JsonPropertyName("user_id")]
        public Guid UserId { get; set; }

        public List<MlRecommendationItem> Recommendations { get; set; } = new();
        public string Strategy { get; set; } = string.Empty;
    }

    public class MlScrapeStatusResponse
    {
        public Guid Id { get; set; }
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("properties_found")]
        public int PropertiesFound { get; set; }

        [JsonPropertyName("properties_saved")]
        public int PropertiesSaved { get; set; }
    }
}