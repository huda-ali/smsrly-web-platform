using DataAccessLayer.Classes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccessLayer.Configures
{
    public class AdminConfigure : IEntityTypeConfiguration<Admin>
    {
        public void Configure(EntityTypeBuilder<Admin> builder)
        {
            builder.ToTable("Admins");
            //relation with User
            builder.HasMany(a => a.Users).WithOne(u => u.admin);
            //relation with Property
            builder.HasMany(a => a.Properties).WithOne(p => p.ManageAdmin);
        }
    }
}
