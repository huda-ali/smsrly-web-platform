using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccessLayer.Classes
{
    public class Service
    {
        public int ServiceID { get; set; }

        public string ServiceName { get; set; }


        public string ServiceType { get; set; }

        public string PhoneNumber { get; set; }


        public string Address { get; set; }


        public ICollection<Property>  Properties { get; set; } 

    }
}
