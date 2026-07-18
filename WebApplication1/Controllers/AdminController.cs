using BusinessLogicLayer.Interfaces;
using DataAccessLayer.Classes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PresentationLayer.DTOs;

namespace PresentationLayer.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("api/AdminApis")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly IAdminRepository _adminRepository;

        public AdminController(IAdminRepository adminRepository)
        {
            _adminRepository = adminRepository;
        }
         [HttpGet("properties")]
        public IActionResult GetAllProperties()
        {
            var properties = _adminRepository.GetAllProperties();

            if (properties == null || !properties.Any())
                return NotFound("No properties found.");

            return Ok(properties);
        }

        [HttpGet("GetAllAdmins")]
        public IActionResult GetAllAdmins()
        {
            var admins = _adminRepository.GetAll().Where(u => !u.IsDeleted)
                .Select(a => new AdminDTO
                {
                    UsserId = a.UsserId,
                    FirstName = a.FirstName,
                    LastName = a.LastName,
                    NationalID = a.NationalID,
                    PhoneNumber = a.PhoneNumber,
                    Email = a.Email,
                    Password = BCrypt.Net.BCrypt.HashPassword(a.Password)
                })
                .ToList();

            return Ok(admins);
        }

        [HttpGet("GetAdmin{id}")]
        public IActionResult GetAdminById(int id)
        {
            var admin = _adminRepository.GetById(id);

            if (admin == null)
                return NotFound();

            var dto = new AdminDTO
            {
                UsserId = admin.UsserId,
                FirstName = admin.FirstName,
                LastName = admin.LastName,
                NationalID = admin.NationalID,
                PhoneNumber = admin.PhoneNumber,
                Email = admin.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(admin.Password)
            };

            return Ok(dto);
        }
        [HttpPost("AddAdmin")]
        public IActionResult AddAdmin(AdminDTO dto)
        {
            Admin admin = new Admin
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                NationalID = dto.NationalID,
                PhoneNumber = dto.PhoneNumber,
                Email = dto.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(dto.Password)
            };

            _adminRepository.Add(admin);
            _adminRepository.Save();

            AdminDTO response = new AdminDTO
            {
                UsserId = admin.UsserId,
                FirstName = admin.FirstName,
                LastName = admin.LastName,
                NationalID = admin.NationalID,
                PhoneNumber = admin.PhoneNumber,
                Email = admin.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(admin.Password)
            };

            return Ok(response);
        }

        [HttpPut("UpdateAdmin{id}")]
        public IActionResult UpdateAdmin(int id, AdminDTO dto)
        {
            var admin = _adminRepository.GetById(id);

            if (admin == null)
                return NotFound();

            admin.FirstName = dto.FirstName;
            admin.LastName = dto.LastName;
            admin.NationalID = dto.NationalID;
            admin.PhoneNumber = dto.PhoneNumber;
            admin.Email = dto.Email;
            if(!string.IsNullOrWhiteSpace(dto.Password)) admin.Password = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            _adminRepository.Update(admin);
            _adminRepository.Save();

            return Ok("update successful");
        }

        [HttpDelete("DeleteAdmin/{id}")]
        public IActionResult DeleteAdmin(int id)
        {
            var admin = _adminRepository.GetById(id);

            if (admin == null)
                return NotFound();

            _adminRepository.SoftDelete(admin);
            _adminRepository.Save();

            return Ok("delete successful");
        }

    }
}
