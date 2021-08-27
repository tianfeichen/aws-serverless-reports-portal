using Amazon.Lambda.Core;
using Newtonsoft.Json.Linq;

namespace Services.Features.Email
{
    /// <summary>
    /// Customise email message used by Cognito
    /// </summary>
    public class EmailHandler
    {
        public JObject Handler(JObject evt, ILambdaContext context)
        {
            // Identify why was this function invoked
            if (evt["triggerSource"].ToString() == "CustomMessage_AdminCreateUser")
            {
                var userName = evt["request"]["usernameParameter"];
                var code = evt["request"]["codeParameter"];
                var siteName = GetSiteName(evt);
                var siteUrl = GetSiteUrl(evt);

                var response = evt["response"];
                response["emailSubject"] = $"Your {siteName} Customer Portal account invitation";
                response["emailMessage"] = $"Hi<BR /><BR />You have been invited to access the {siteName} Customer Portal<BR /><BR />" +
                    $"Your username is {userName} and temporary password is {code}<BR /><BR />" +
                    $"Please login and reset your password at <a href=\"{siteUrl}\">{siteUrl}</a>";
                response["smsMessage"] = $"Your username is {userName} and temporary password is {code}.";
            }

            return evt;
        }

        /// <summary>
        /// Get site from custom property
        /// possible values are "A B", "C", "N", "S"
        /// </summary>
        /// <param name="evt"></param>
        /// <returns></returns>
        private string GetSite(JObject evt)
        {
            return evt["request"]["userAttributes"]["custom:site"].ToString();
        }

        private string GetSiteName(JObject evt)
        {
            return GetSite(evt);
        }

        private string GetSiteUrl(JObject evt)
        {
            var site = GetSite(evt);
            switch (site)
            {
                case "A B":
                    return "https://ab/login";
                case "C":
                    return "http://c/";
                case "N":
                    return "http://n/";
                case "S":
                    return "http://s/";
                default:
                    return "https://ab/login";
            }
        }
    }
}
