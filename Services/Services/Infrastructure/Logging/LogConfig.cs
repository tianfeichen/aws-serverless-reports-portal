using Serilog;
using System;

namespace Services.Infrastructure.Logging
{
    public class LogConfig
    {
        public static void Configure(Func<LoggerConfiguration, LoggerConfiguration> modifier = null)
        {
            modifier = modifier ?? (l => l);

            Log.Logger = modifier(new LoggerConfiguration()
                .Enrich.FromLogContext()
                .WriteTo.Console()
            ).CreateLogger();
        }
    }
}
