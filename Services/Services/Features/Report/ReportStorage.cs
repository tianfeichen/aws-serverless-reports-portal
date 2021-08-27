using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Serilog;
using System;
using System.IO;
using System.Threading.Tasks;

namespace Services.Features.Report
{
    public class ReportStorage
    {
        public readonly string Region;
        public readonly string ReportS3Bucket;

        AmazonS3Client _client;

        public ReportStorage()
        {
            Region = Environment.GetEnvironmentVariable(nameof(Region));
            ReportS3Bucket = Environment.GetEnvironmentVariable(nameof(ReportS3Bucket));

            _client = new AmazonS3Client(RegionEndpoint.GetBySystemName(Region));
        }

        public async Task UploadToS3Async(byte[] bytes, string key, string name, string site, string path)
        {
            Log.Logger.Information("Uploading {bytesLength} bytes to s3 bucket {bucket} key {key}", bytes.Length, ReportS3Bucket, key);

            using (var stream = new MemoryStream(bytes))
            {
                var putRequest = new PutObjectRequest
                {
                    BucketName = ReportS3Bucket,
                    Key = key,
                    InputStream = stream
                };
                putRequest.Metadata.Add("x-amz-meta-name", name);
                putRequest.Metadata.Add("x-amz-meta-site", site);
                putRequest.Metadata.Add("x-amz-meta-path", path);

                var response = await _client.PutObjectAsync(putRequest);
                Log.Logger.Information(response.ToString());
            }
        }
    }
}
