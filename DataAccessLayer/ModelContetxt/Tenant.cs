using DataAccessLayer.ModelContetxt;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccessLayer.Classes
{
    public class Tenant:User
    {
       public ICollection<Review> Reviews { get; set; }
       public ICollection<Message> Messages { get; set; }
     
        public Preferences? Preferences { get; set; }


    }
}
