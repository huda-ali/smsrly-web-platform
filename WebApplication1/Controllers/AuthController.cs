using BusinessLogicLayer.Interfaces;
using DataAccessLayer.Classes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PresentationLayer.DTOs.Auth;

namespace PresentationLayer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthRepository _authRepository;

        public AuthController(IAuthRepository authRepository)
        {
            _authRepository = authRepository;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("register/admin")]
        public IActionResult RegisterAdmin(RegisterAdminDTO dto)
        {
            try
            {
                var admin = new Admin
                {
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    NationalID = dto.NationalID,
                    PhoneNumber = dto.PhoneNumber,
                    Email = dto.Email
                };

                var (accessToken, refreshToken, expiresIn) = _authRepository.RegisterAdmin(admin, dto.Password);

                return Ok(new AuthResponseDTO
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    ExpiresIn = expiresIn,
                    Role = "Admin"
                });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpPost("register/owner")]
        public IActionResult RegisterOwner(RegisterOwnerDTO dto)
        {
            try
            {
                var owner = new Owner
                {
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    NationalID = dto.NationalID,
                    BusinessTaxID = dto.BusinessTaxID,
                    PhoneNumber = dto.PhoneNumber,
                    Email = dto.Email
                };

                var (accessToken, refreshToken, expiresIn) = _authRepository.RegisterOwner(owner, dto.Password);

                return Ok(new AuthResponseDTO
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    ExpiresIn = expiresIn,
                    Role = "Owner"
                });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpPost("register/tenant")]
        public IActionResult RegisterTenant(RegisterTenantDTO dto)
        {
            try
            {
                var tenant = new Tentant
                {
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    NationalID = dto.NationalID,
                    PhoneNumber = dto.PhoneNumber,
                    Email = dto.Email
                };

                var (accessToken, refreshToken, expiresIn) = _authRepository.RegisterTenant(tenant, dto.Password);

                return Ok(new AuthResponseDTO
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    ExpiresIn = expiresIn,
                    Role = "Tenant"
                });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public IActionResult Login(LoginDTO dto)
        {
            try
            {
                var (accessToken, refreshToken, expiresIn, role) = _authRepository.Login(dto.Email, dto.Password);

                return Ok(new AuthResponseDTO
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    ExpiresIn = expiresIn,
                    Role = role
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
    }
}