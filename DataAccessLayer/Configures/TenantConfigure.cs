using System;
using System.Collections.Generic;
using System.Text;
using DataAccessLayer.Classes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DataAccessLayer.Configures
{
    public class TenantConfigure : IEntityTypeConfiguration<Tenant>
    {
        public void Configure(EntityTypeBuilder<Tenant> builder)
        {
            builder.HasMany(t => t.Reviews).WithOne(r => r.Reiewer).OnDelete(DeleteBehavior.NoAction);
        }
    }
}
