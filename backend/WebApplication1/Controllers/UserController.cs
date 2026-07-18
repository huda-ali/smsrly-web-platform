using BusinessLogicLayer.Interfaces;
using DataAccessLayer.Classes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PresentationLayer.DTOs;

namespace WebApplication1.Controllers
{
    [Route("api/UsersAPis")]
    [ApiController]
    public class UserController : ControllerBase
    {
       
        private readonly IUserRepository _userRepository;

        public UserController(
            
            IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("GetAllUsers")]
        public IActionResult GetAllUsers()
        {
            var users = _userRepository.GetAll()
                .Where(u => !u.IsDeleted)
                .Select(u => new UserDTO
                {
                    UsserId = u.UsserId,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    NationalID = u.NationalID,
                    PhoneNumber = u.PhoneNumber,
                    Email = u.Email,
                    Role = u.GetType().Name
                })
                .ToList();

            return Ok(users);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("GetUserById/{id}")]
        public IActionResult GetUserById(int id)
        {
            var user = _userRepository.GetById(id);

            if (user == null)
                return NotFound("User not found.");

            var dto = new UserDTO
            {
                UsserId = user.UsserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                NationalID = user.NationalID,
                PhoneNumber = user.PhoneNumber,
                Email = user.Email,
                Role = user.GetType().Name
            };

            return Ok(dto);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("GetUserByEmail")]
        public IActionResult GetUserByEmail(string email)
        {
            var user = _userRepository.GetByEmail(email);

            if (user == null)
                return NotFound("User not found.");

            var dto = new UserDTO
            {
                UsserId = user.UsserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                NationalID = user.NationalID,
                PhoneNumber = user.PhoneNumber,
                Email = user.Email,
                Role = user.GetType().Name
            };

            return Ok(dto);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("GetUserByPhone")]
        public IActionResult GetUserByPhone(string phoneNumber)
        {
            var user = _userRepository.GetByPhone(phoneNumber);

            if (user == null)
                return NotFound("User not found.");

            var dto = new UserDTO
            {
                UsserId = user.UsserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                NationalID = user.NationalID,
                PhoneNumber = user.PhoneNumber,
                Email = user.Email,
                Role = user.GetType().Name
            };

            return Ok(dto);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("AddUser")]
        public IActionResult AddUser(UserDTO dto)
        {
            if (dto == null)
                return BadRequest("Invalid data.");

            if (_userRepository.GetByEmail(dto.Email) != null)
                return BadRequest("Email already exists.");

            if (_userRepository.GetByPhone(dto.PhoneNumber) != null)
                return BadRequest("Phone number already exists.");

            User user = new User
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                NationalID = dto.NationalID,
                PhoneNumber = dto.PhoneNumber,
                Email = dto.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                IsDeleted = false
            };

            _userRepository.Add(user);
            _userRepository.Save();

            dto.UsserId = user.UsserId;

            return Ok(new
            {
                Message = "User added successfully.",
                User = dto
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("UpdateUser")]
        public IActionResult UpdateUser(UserDTO dto)
        {
            var user = _userRepository.GetById(dto.UsserId);

            if (user == null)
                return NotFound("User not found.");
            
            var natIDUser = _userRepository.GetByNationalID(dto.NationalID);
            if (natIDUser != null && natIDUser.UsserId != dto.UsserId)
                return BadRequest("National ID already exists.");

            var emailUser = _userRepository.GetByEmail(dto.Email);
            if (emailUser != null && emailUser.UsserId != dto.UsserId)
                return BadRequest("Email already exists.");

            var phoneUser = _userRepository.GetByPhone(dto.PhoneNumber);
            if (phoneUser != null && phoneUser.UsserId != dto.UsserId)
                return BadRequest("Phone number already exists.");

            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.NationalID = dto.NationalID;
            user.Email = dto.Email;
            user.PhoneNumber = dto.PhoneNumber;
            if(!string.IsNullOrWhiteSpace(dto.Password)) user.Password = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            _userRepository.Update(user);
            _userRepository.Save();

            return Ok(new
            {
                Message = "User updated successfully."
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("DeleteUser/{id}")]
        public IActionResult DeleteUser(int id)
        {
            var user = _userRepository.GetById(id);

            if (user == null)
                return NotFound("User not found.");

            _userRepository.SoftDelete(user);
            _userRepository.Save();

            return Ok(new
            {
                Message = "User deleted successfully."
            });
        }

    }
}