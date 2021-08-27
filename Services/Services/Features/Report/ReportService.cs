using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Serilog;

namespace Services.Features.Report
{
    public class ReportService
    {
        IDictionary _environmentVariables;
        ReportStorage _reportStorage;

        public ReportService()
        {
            Log.Logger.Information("Initialise {Service}", nameof(ReportService));

            _environmentVariables = Environment.GetEnvironmentVariables();
            Log.Logger.Information("Environment variables loaded");
            Log.Logger.Information(_environmentVariables.ToString());

            _reportStorage = new ReportStorage();
        }

        public async Task GenerateAsync()
        {
            // Simulate a long running task
            Thread.Sleep(5 * 1000);

            var reports = List();
            foreach (var report in reports)
            {
                var bytes = Render(report.Path, "json");
                var key = $"{report.Id}.json";
                await _reportStorage.UploadToS3Async(bytes, key, report.Name, report.Site, report.Path);
            }

            Thread.Sleep(5 * 1000);
        }

        public List<Report> List()
        {
            var reports = new List<Report>();

            // Generate placeholder reports
            for (int i = 1; i <= 10; i++)
            {
                var report = new Report
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = i.ToString(),
                    Site = i % 2 == 0 ? "Even" : "Odd",
                    Path = "/",
                    CreationDate = DateTime.Now,
                    ModifiedDate = DateTime.Now
                };
                reports.Add(report);
            }

            Log.Logger.Information("Listed {reportsCount} reports", reports.Count);
            foreach (var report in reports)
            {
                Log.Logger.Information("Report {reportId}: {reportName} @ {reportPath}", report.Id, report.Name, report.Path);
            }
            return reports;
        }

        public byte[] Render(string reportPath, string format)
        {
            Log.Logger.Information("Rendering report {reportPath} in {format} format", reportPath, format);

            // Generate json content
            var content = $"{{Path: ${reportPath}, ModifiedDate: ${DateTime.Now}}}";
            var result = Encoding.ASCII.GetBytes(content);

            Log.Logger.Information("Rendered report {reportPath} in {format} format in {resultLength} bytes", reportPath, format, result.Length);
            return result;
        }
    }
}
