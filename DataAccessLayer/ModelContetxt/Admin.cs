using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Classes
{
    public class Admin:User
    {
       
        public ICollection<User> Users { get; set; }
        public ICollection<Property> Properties { get; set; }



    }
}
