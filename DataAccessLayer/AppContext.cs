using Azure.Messaging;
using DataAccessLayer.Classes;
using DataAccessLayer.Configures;
using DataAccessLayer.ModelContetxt;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
namespace DataAccessLayer
{
    public class AppContext : DbContext
    {
        public AppContext(DbContextOptions<AppContext> options)
          : base(options)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            IConfiguration configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false)
                .AddJsonFile("appsettings.Development.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            optionsBuilder.UseSqlServer(configuration.GetConnectionString("DefaultConnection"));
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            new UserConfigure().Configure(modelBuilder.Entity<User>());
            new AdminConfigure().Configure(modelBuilder.Entity<Admin>());
            new PropertyConfigure().Configure(modelBuilder.Entity<Property>());
            new OwnerConfigure().Configure(modelBuilder.Entity<Owner>());
            new TenantConfigure().Configure(modelBuilder.Entity<Tentant>());
            new ReviewConfigure().Configure(modelBuilder.Entity<Review>());
            new ServiceConfigure().Configure(modelBuilder.Entity<Service>());
            new MessageConfigure().Configure(modelBuilder.Entity<Message>());
            new PreferencesConfiguration().Configure(modelBuilder.Entity<Preferences>());

           
        }



        public DbSet<Message> Messages { get; set; }

        public DbSet<Preferences> Preferences { get; set; }




    }
}