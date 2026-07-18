using System;
using System.Collections.Generic;
using System.Text;
using DataAccessLayer.Classes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DataAccessLayer.Configures
{
    internal class OwnerConfigure : IEntityTypeConfiguration<Owner>
    {
        public void Configure(EntityTypeBuilder<Owner> builder)
        {
             builder.ToTable("Owner");
             builder.HasMany(o => o.Properties).WithOne(p => p.Owner);
             builder.HasMany(o=>o.Messages).WithOne(p => p.Owner).OnDelete(DeleteBehavior.NoAction);

        }
    }
}
