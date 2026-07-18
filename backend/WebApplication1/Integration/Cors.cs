namespace PresentationLayer.Integration
{
    public static class Cors
    {
        public const string ReactAppPolicy = "ReactAppPolicy";

        public static IServiceCollection AddReactCors(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            var allowedOrigin = configuration["Cors:ReactAppOrigin"]
                                ?? throw new InvalidOperationException("Cors:ReactAppOrigin is not set");

            services.AddCors(options =>
            {
                options.AddPolicy(ReactAppPolicy, policy =>
                {
                    policy.WithOrigins(allowedOrigin)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
            });

            return services;
        }
    }
}