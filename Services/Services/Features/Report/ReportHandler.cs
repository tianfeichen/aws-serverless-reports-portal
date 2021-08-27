using Services.Infrastructure.Logging;
using System.Threading.Tasks;
using Amazon.Lambda.Core;
using Serilog;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]
namespace Services.Features.Report
{
    public class ReportHandler
    {
        public ReportHandler()
        {
            LogConfig.Configure();
            Log.Logger.Information("{Handler} initialised", nameof(ReportHandler));
        }

        /// <summary>
        /// A long running task.
        /// </summary>
        /// <returns></returns>
        public async Task Generate()
        {
            Log.Logger.Information("Generating reports");

            var reportService = new ReportService();
            await reportService.GenerateAsync();

            Log.Logger.Information("Generated reports successfully");
        }
    }
}
