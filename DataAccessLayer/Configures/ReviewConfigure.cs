using System;
using System.Collections.Generic;
using System.Text;
using DataAccessLayer.ModelContetxt;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DataAccessLayer.Configures
{
    public class ReviewConfigure : IEntityTypeConfiguration<Review>
    {
        public void Configure(EntityTypeBuilder<Review> builder)
        {
            builder.HasKey(r => r.ReviewID);
            builder.Property(r => r.TimewStamp)
          .HasComputedColumnSql(
          "DATEDIFF(SECOND, [ReciveDate], [ReadDate]) / 3600.0",
          stored: true);


        }
    }
}
