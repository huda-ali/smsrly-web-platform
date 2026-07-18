using DataAccessLayer.Classes;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccessLayer.ModelContetxt
{
    public class Review
    {
        public int ReviewID { get; set; }
        public string Content { get; set; }
        public DateTime ReciveDate { get; set; }
        public DateTime ReadDate { get; set; }
        public TimeSpan TimewStamp { get; set; }
        public Property ReviewdProperty { get; set; }

        public Tenant Reiewer { get; set; }

    }
}
