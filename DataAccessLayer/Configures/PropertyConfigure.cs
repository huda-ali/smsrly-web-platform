using DataAccessLayer.Classes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccessLayer.Configures
{
    public class PropertyConfigure : IEntityTypeConfiguration<Property>
    {
        public void Configure(EntityTypeBuilder<Property> builder)
        {
            builder.HasKey(p => p.ProperyID);
            builder.HasMany(p => p.Reviews).WithOne(r => r.ReviewdProperty);
            builder.HasMany(p => p.Services).WithMany(s => s.Properties);
        }
    }
}
