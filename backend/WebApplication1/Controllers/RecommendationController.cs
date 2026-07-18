using System.IdentityModel.Tokens.Jwt;
using BusinessLogicLayer.Interfaces;
using BusinessLogicLayer.ML;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PresentationLayer.DTOs.Recommendations;

namespace PresentationLayer.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RecommendationController : ControllerBase
    {
        private readonly IMlApiClient _mlApiClient;

        public RecommendationController(IMlApiClient mlApiClient)
        {
            _mlApiClient = mlApiClient;
        }

        [HttpGet]
        public async Task<IActionResult> GetRecommendations([FromQuery] int topN = 10)
        {
            var mlUserId = GetMlUserId();

            var result = await _mlApiClient.GetRecommendationsAsync(mlUserId, topN);

            var dtos = result.Recommendations.Select(r => new PropertyRecommendationDTO
            {
                PropertyId = r.Property.Id,
                Title = r.Property.Title,
                Price = r.Property.Price,
                City = r.Property.City,
                Country = r.Property.Country,
                Bedrooms = r.Property.Bedrooms,
                Bathrooms = r.Property.Bathrooms,
                PropertyType = r.Property.PropertyType,
                Images = r.Property.Images,
                Score = r.Score,
                Reason = r.Reason
            });

            return Ok(dtos);
        }

        [HttpGet("similar/{propertyId}")]
        public async Task<IActionResult> GetSimilarProperties(Guid propertyId, [FromQuery] int topN = 10)
        {
            var items = await _mlApiClient.GetSimilarPropertiesAsync(propertyId, topN);

            var dtos = items.Select(i => new PropertyRecommendationDTO
            {
                PropertyId = i.Property.Id,
                Title = i.Property.Title,
                Price = i.Property.Price,
                City = i.Property.City,
                Country = i.Property.Country,
                Bedrooms = i.Property.Bedrooms,
                Bathrooms = i.Property.Bathrooms,
                PropertyType = i.Property.PropertyType,
                Images = i.Property.Images,
                Score = i.Score,
                Reason = i.Reason
            });

            return Ok(dtos);
        }

        [HttpPost("interact")]
        public async Task<IActionResult> RecordInteraction(RecordInteractionDTO dto)
        {
            var mlUserId = GetMlUserId();

            await _mlApiClient.RecordInteractionAsync(mlUserId, dto.PropertyId, dto.InteractionType, dto.Rating);

            return Ok();
        }

        [HttpPost("preferences")]
        public async Task<IActionResult> UpdatePreferences(UpdatePreferencesDTO dto)
        {
            var mlUserId = GetMlUserId();

            await _mlApiClient.UpdatePreferencesAsync(mlUserId, new MlPreferencesRequest
            {
                PreferredCities = dto.PreferredCities,
                MinPrice = dto.MinPrice,
                MaxPrice = dto.MaxPrice,
                MinBedrooms = dto.MinBedrooms
            });

            return Ok();
        }

        private Guid GetMlUserId()
        {
            var userId = int.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
            return MlUserIdMapper.ToMlUserId(userId);
        }
    }
}