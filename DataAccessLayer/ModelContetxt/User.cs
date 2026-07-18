namespace DataAccessLayer.Classes
{
    public class User
    {
      
       public int UsserId { get; set; } 

       public string FirstName { get; set; }

       public string LastName { get; set; }
       
       public string NationalID { get; set; }
       
       public string PhoneNumber { get; set; }

       public string Password { get; set; }

       public string Email { get; set; }
       
       public bool IsDeleted { get; set; }

       public Admin?admin { get; set; }

    }
}
