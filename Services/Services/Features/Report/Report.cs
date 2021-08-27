using System;

namespace Services.Features.Report
{
    public class Report
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Site { get; set; }
        public string Path { get; set; }
        public DateTime CreationDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public override string ToString()
        {
            return $"{Name}: {Path}";
        }
    }
}
