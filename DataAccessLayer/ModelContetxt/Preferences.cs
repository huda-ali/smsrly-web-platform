using DataAccessLayer.ModelContetxt;
using System.Collections.Generic;

namespace DataAccessLayer.Classes
{
    public class Preferences
    {
        public int PreferencesID { get; set; }
        public string SoloOrShared { get; set; }       
        public string PreferredLocation { get; set; }
        public string LocationNearness { get; set; }
        public int MinPrice { get; set; }
        public int MaxPrice { get; set; }
        public int NumberOfRooms { get; set; }
        public string Type { get; set; }               
        public string Services { get; set; }          

        
        public Tenant Tenant { get; set; }
    }
}   



