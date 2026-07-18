using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccessLayer.Classes
{
    public class Message
    {
        public int MessageID { get; set; }

        public string Content { get; set; }
        public int SenderFlag { get; set; }

        public DateTime ReciveDate { get; set; }
        public DateTime ReadDate { get; set; }
        
        public TimeSpan TimeStamp { get; set; }

        public bool Isdeleted { get; set; }

        public Owner Owner { get; set; }

        public Tenant tentant { get; set; }

    }
}
