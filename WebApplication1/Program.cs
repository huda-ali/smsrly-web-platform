using System.Text;
using BusinessLogicLayer.Interfaces;
using BusinessLogicLayer.Repositories;
using DataAccessLayer;
using Microsoft.AspNetCore.Authorization;
using PresentationLayer.Authentication;
using PresentationLayer.Authorization;
using Microsoft.EntityFrameworkCore;
using PresentationLayer.Integration;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration
    .AddJsonFile("jwtsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile("corssettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile("mlapisettings.json", optional: false, reloadOnChange: true);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

// Register DbContext
builder.Services.AddDbContext<DataAccessLayer.AppContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// Register Repository
builder.Services.AddScoped<IAdminRepository, AdminRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IMessageRepository,MessageRepository>();
builder.Services.AddScoped<IOwnerRepository,OwnerRepository>();
builder.Services.AddScoped<ITenantRepository,TenantRepository>();
builder.Services.AddScoped<IPropertyRepository,PropertyRepository>();
builder.Services.AddScoped<IServiceRepository,ServiceRepository>();
builder.Services.AddScoped<IReviewRepository,ReviewRepository>();
builder.Services.AddScoped<IPreferencesRepository,PreferencesRepository>();

// Register Authentication
builder.Services.AddScoped<IAuthRepository, AuthRepository>();

// Register Authorization
builder.Services.AddScoped<IAuthorizationHandler, MustOwnHandler>();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("MustOwnProperty", policy =>
        policy.Requirements.Add(new MustOwnRequirement()));
});

// JWT Auth + Swagger
builder.Services.AddJwtAuth(builder.Configuration);
builder.Services.AddSwaggerJwt();

// Add CORS
builder.Services.AddReactCors(builder.Configuration);

// Register ML
var mlApiBaseUrl = builder.Configuration["MlApi:BaseUrl"]
                   ?? throw new InvalidOperationException("MlApi:BaseUrl is not set");

builder.Services.AddHttpClient<IMlApiClient, MlApiClient>(client =>
{
    client.BaseAddress = new Uri(mlApiBaseUrl.TrimEnd('/') + "/");
    client.Timeout = TimeSpan.FromSeconds(15);
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors(Cors.ReactAppPolicy);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();