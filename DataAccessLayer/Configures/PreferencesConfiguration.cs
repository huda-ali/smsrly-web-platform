using DataAccessLayer.Classes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccessLayer.Configures
{
    public class PreferencesConfiguration : IEntityTypeConfiguration<Preferences>
    {
        public void Configure(EntityTypeBuilder<Preferences> builder)
        {
            
            builder.HasKey(p => p.PreferencesID);

            builder.Property(p => p.SoloOrShared)
                   .IsRequired()
                   .HasMaxLength(50);

            builder.Property(p => p.PreferredLocation)
                   .IsRequired()
                   .HasMaxLength(100);

            builder.Property(p => p.LocationNearness)
                   .HasMaxLength(100);

            builder.Property(p => p.Type)
                   .HasMaxLength(50);

            builder.Property(p => p.Services)
                   .HasMaxLength(200);

            builder.HasOne(p => p.Tenant)
                   .WithOne(t => t.Preferences)
                   .HasForeignKey<Preferences>("TenantID");
        }
    }
}
