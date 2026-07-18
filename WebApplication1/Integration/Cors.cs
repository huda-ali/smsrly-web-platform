namespace PresentationLayer.Integration
{
    public static class Cors
    {
        public const string ReactAppPolicy = "ReactAppPolicy";

        public static IServiceCollection AddReactCors(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:5173" };
            
            services.AddCors(options =>
            {
                options.AddPolicy(ReactAppPolicy, policy =>
                {
                    policy.WithOrigins(allowedOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
            });

            return services;
        }
    }
}