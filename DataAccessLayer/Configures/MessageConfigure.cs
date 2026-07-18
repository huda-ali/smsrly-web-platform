using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.EntityFrameworkCore;
using DataAccessLayer.Classes;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace DataAccessLayer.Configures
{
    public class MessageConfigure : IEntityTypeConfiguration<Message>
    {
        public void Configure(EntityTypeBuilder<Message> builder)
        {
            builder.HasKey(m => m.MessageID);
            builder.Property(m => m.TimeStamp)
           .HasComputedColumnSql(
           "DATEDIFF(SECOND, [ReciveDate], [ReadDate]) / 3600.0",
           stored: true);


        }
    }
}
