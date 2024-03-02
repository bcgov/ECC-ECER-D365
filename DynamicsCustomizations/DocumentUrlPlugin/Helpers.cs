using System;
using System.Collections.Generic;
using System.Linq;
using System.ServiceModel.Description;
using System.Net.Http;
using System.Net.Http.Headers;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Sdk.Client;
using Microsoft.Crm.Sdk.Messages;

namespace BCGOV.Plugin.DocumentUrl
{
    public static class Helpers
    {
        public static List<Entity> GetSystemConfigurations(IOrganizationService service, string group, string key)
        {
            List<Entity> result = new List<Entity>();

            QueryExpression exp = new QueryExpression("bcgov_config");
            exp.NoLock = true;
            exp.ColumnSet.AllColumns = true;
            exp.Criteria.AddCondition("statecode", ConditionOperator.Equal, 0); //Active
            if (!string.IsNullOrEmpty(group))
                exp.Criteria.AddCondition("bcgov_group", ConditionOperator.Equal, group);
            if (!string.IsNullOrEmpty(key))
                exp.Criteria.AddCondition("bcgov_key", ConditionOperator.Equal, key);

            var coll = service.RetrieveMultiple(exp);
            if (coll != null && coll.Entities != null && coll.Entities.Count > 0)
                result = coll.Entities.ToList();

            if (result.Count < 1)
                throw new InvalidPluginExecutionException(string.Format("System Configuration for Group '{0}', Key '{1}' doesn't exist..", group, key));

            return result;
        }

        public static string GetConfigKeyValue(List<Entity> configurations, string key, string group)
        {
            if (string.IsNullOrEmpty(key))
                throw new InvalidPluginExecutionException("Config Key is required..");

            foreach (var configEntity in configurations)
            {
                if (configEntity["bcgov_key"].ToString().Equals(key, StringComparison.InvariantCultureIgnoreCase))
                {
                    bool isFinal = false;
                    if (!string.IsNullOrEmpty(group))
                    {
                        if (configEntity["bcgov_group"].ToString().Equals(group, StringComparison.InvariantCultureIgnoreCase))
                            isFinal = true;
                        else
                            isFinal = false;
                    }
                    else
                        isFinal = true;

                    if (isFinal)
                        return configEntity["bcgov_value"].ToString();
                }
            }

            throw new InvalidPluginExecutionException(string.Format("Unable to find configuration with Key '{0}', Group '{1}'..", key, group));
        }

        public static string GetSecureConfigKeyValue(List<Entity> configurations, string key, string group)
        {
            if (string.IsNullOrEmpty(key))
                throw new InvalidPluginExecutionException("Config Key is required..");

            foreach (var configEntity in configurations)
            {
                if (configEntity["bcgov_key"].ToString().Equals(key, StringComparison.InvariantCultureIgnoreCase))
                {
                    bool isFinal = false;
                    if (!string.IsNullOrEmpty(group))
                    {
                        if (configEntity["bcgov_group"].ToString().Equals(group, StringComparison.InvariantCultureIgnoreCase))
                            isFinal = true;
                        else
                            isFinal = false;
                    }
                    else
                        isFinal = true;

                    if (isFinal)
                        return configEntity["bcgov_securevalue"].ToString();
                }
            }

            throw new InvalidPluginExecutionException(string.Format("Unable to find configuration with Key '{0}', Group '{1}'..", key, group));
        }

        public static IOrganizationService InitializeOrganizationService(string serverUrl, string orgName, string deploymentType, string userName, string password)
        {
            Console.WriteLine(string.Format("Initializing organization service to '{0}'", serverUrl));

            var credentials = new ClientCredentials();
            if (string.IsNullOrEmpty(userName) || string.IsNullOrEmpty(password))
                credentials.Windows.ClientCredential = System.Net.CredentialCache.DefaultNetworkCredentials;
            else
            {
                credentials.UserName.UserName = userName;
                credentials.UserName.Password = password;
            }

            Uri crmServerUrl;
            if (deploymentType.Equals("CrmOnline", StringComparison.InvariantCultureIgnoreCase))
                crmServerUrl = new Uri(string.Format("{0}/XRMServices/2011/Organization.svc", serverUrl));
            else
                crmServerUrl = new Uri(string.Format("{0}/{1}/XRMServices/2011/Organization.svc", serverUrl, orgName));

            System.Net.ServicePointManager.SecurityProtocol = System.Net.SecurityProtocolType.Tls12;

            using (OrganizationServiceProxy serviceProxy = new OrganizationServiceProxy(crmServerUrl, null, credentials, null))
            {
                serviceProxy.EnableProxyTypes();
                serviceProxy.Timeout = new TimeSpan(1, 0, 0);
                return (IOrganizationService)serviceProxy;
            }
        }

        public static IOrganizationService InitializeProxyOrganizationService(string serverUrl, string orgName, string deploymentType, string userName, string password, Guid callerId)
        {
            Console.WriteLine(string.Format("Initializing organization service to '{0}'", serverUrl));

            var credentials = new ClientCredentials();
            if (string.IsNullOrEmpty(userName) || string.IsNullOrEmpty(password))
                credentials.Windows.ClientCredential = System.Net.CredentialCache.DefaultNetworkCredentials;
            else
            {
                credentials.UserName.UserName = userName;
                credentials.UserName.Password = password;
            }

            Uri crmServerUrl;
            if (deploymentType.Equals("CrmOnline", StringComparison.InvariantCultureIgnoreCase))
                crmServerUrl = new Uri(string.Format("{0}/XRMServices/2011/Organization.svc", serverUrl));
            else
                crmServerUrl = new Uri(string.Format("{0}/{1}/XRMServices/2011/Organization.svc", serverUrl, orgName));

            System.Net.ServicePointManager.SecurityProtocol = System.Net.SecurityProtocolType.Tls12;

            using (OrganizationServiceProxy serviceProxy = new OrganizationServiceProxy(crmServerUrl, null, credentials, null))
            {
                serviceProxy.CallerId = callerId;
                serviceProxy.Timeout = new TimeSpan(4, 0, 0);
                serviceProxy.EnableProxyTypes();
                return (IOrganizationService)serviceProxy;
            }
        }

        public static DiscoveryServiceProxy InitializeDiscoveryService(string serverUrl, string orgName, string deploymentType, string userName, string password)
        {
            Console.WriteLine(string.Format("Initializing discovery service to '{0}'", serverUrl));

            var credentials = new ClientCredentials();
            if (string.IsNullOrEmpty(userName) || string.IsNullOrEmpty(password))
                credentials.Windows.ClientCredential = System.Net.CredentialCache.DefaultNetworkCredentials;
            else
            {
                credentials.UserName.UserName = userName;
                credentials.UserName.Password = password;
            }

            Uri crmServerUrl;
            if (deploymentType.Equals("CrmOnline", StringComparison.InvariantCultureIgnoreCase))
                crmServerUrl = new Uri(string.Format("{0}/XRMServices/2011/Discovery.svc", serverUrl));
            else
                crmServerUrl = new Uri(string.Format("{0}/{1}/XRMServices/2011/Discovery.svc", serverUrl, orgName));

            System.Net.ServicePointManager.SecurityProtocol = System.Net.SecurityProtocolType.Tls12;

            using (DiscoveryServiceProxy serviceProxy = new DiscoveryServiceProxy(crmServerUrl, null, credentials, null))
            {
                serviceProxy.Timeout = new TimeSpan(4, 0, 0);
                return serviceProxy;
            }
        }

        public static string GetBearerToken(string url, string clientId, string secret)
        {
            string token = string.Empty;

            using (HttpClient httpClient = new HttpClient())
            {
                httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/x-www-form-urlencoded"));
                httpClient.BaseAddress = new Uri(url);

                var body = string.Format("grant_type=client_credentials&scope=openid&client_id={0}&client_secret={1}", clientId, secret);

                HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, url);
                request.Content = new StringContent(body, System.Text.Encoding.UTF8, "application/x-www-form-urlencoded");

                HttpResponseMessage response = httpClient.SendAsync(request).Result;
                if (response.StatusCode == System.Net.HttpStatusCode.OK)
                {
                    var httpResponse = response.Content.ReadAsStringAsync().Result;

                    var jsonReader = System.Runtime.Serialization.Json.JsonReaderWriterFactory.CreateJsonReader(System.Text.Encoding.UTF8.GetBytes(httpResponse), new System.Xml.XmlDictionaryReaderQuotas());

                    var root = System.Xml.Linq.XElement.Load(jsonReader);
                    if (root.Element("access_token") != null)
                    {
                        token = root.Element("access_token").Value;
                    }
                }
            }

            if (string.IsNullOrEmpty(token))
                throw new InvalidPluginExecutionException("Unable to secure bearer token..");

            return token;
        }

        private static readonly Dictionary<string, string> MIMETypesDictionary = new Dictionary<string, string>
      {
        {"ai", "application/postscript"},
        {"aif", "audio/x-aiff"},
        {"aifc", "audio/x-aiff"},
        {"aiff", "audio/x-aiff"},
        {"asc", "text/plain"},
        {"atom", "application/atom+xml"},
        {"au", "audio/basic"},
        {"avi", "video/x-msvideo"},
        {"bcpio", "application/x-bcpio"},
        {"bin", "application/octet-stream"},
        {"bmp", "image/bmp"},
        {"cdf", "application/x-netcdf"},
        {"cgm", "image/cgm"},
        {"class", "application/octet-stream"},
        {"cpio", "application/x-cpio"},
        {"cpt", "application/mac-compactpro"},
        {"csh", "application/x-csh"},
        {"css", "text/css"},
        {"dcr", "application/x-director"},
        {"dif", "video/x-dv"},
        {"dir", "application/x-director"},
        {"djv", "image/vnd.djvu"},
        {"djvu", "image/vnd.djvu"},
        {"dll", "application/octet-stream"},
        {"dmg", "application/octet-stream"},
        {"dms", "application/octet-stream"},
        {"doc", "application/msword"},
        {"docx","application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
        {"dotx", "application/vnd.openxmlformats-officedocument.wordprocessingml.template"},
        {"docm","application/vnd.ms-word.document.macroEnabled.12"},
        {"dotm","application/vnd.ms-word.template.macroEnabled.12"},
        {"dtd", "application/xml-dtd"},
        {"dv", "video/x-dv"},
        {"dvi", "application/x-dvi"},
        {"dxr", "application/x-director"},
        {"eps", "application/postscript"},
        {"etx", "text/x-setext"},
        {"exe", "application/octet-stream"},
        {"ez", "application/andrew-inset"},
        {"gif", "image/gif"},
        {"gram", "application/srgs"},
        {"grxml", "application/srgs+xml"},
        {"gtar", "application/x-gtar"},
        {"hdf", "application/x-hdf"},
        {"hqx", "application/mac-binhex40"},
        {"htm", "text/html"},
        {"html", "text/html"},
        {"ice", "x-conference/x-cooltalk"},
        {"ico", "image/x-icon"},
        {"ics", "text/calendar"},
        {"ief", "image/ief"},
        {"ifb", "text/calendar"},
        {"iges", "model/iges"},
        {"igs", "model/iges"},
        {"jnlp", "application/x-java-jnlp-file"},
        {"jp2", "image/jp2"},
        {"jpe", "image/jpeg"},
        {"jpeg", "image/jpeg"},
        {"jpg", "image/jpeg"},
        {"js", "application/x-javascript"},
        {"kar", "audio/midi"},
        {"latex", "application/x-latex"},
        {"lha", "application/octet-stream"},
        {"lzh", "application/octet-stream"},
        {"m3u", "audio/x-mpegurl"},
        {"m4a", "audio/mp4a-latm"},
        {"m4b", "audio/mp4a-latm"},
        {"m4p", "audio/mp4a-latm"},
        {"m4u", "video/vnd.mpegurl"},
        {"m4v", "video/x-m4v"},
        {"mac", "image/x-macpaint"},
        {"man", "application/x-troff-man"},
        {"mathml", "application/mathml+xml"},
        {"me", "application/x-troff-me"},
        {"mesh", "model/mesh"},
        {"mid", "audio/midi"},
        {"midi", "audio/midi"},
        {"mif", "application/vnd.mif"},
        {"mov", "video/quicktime"},
        {"movie", "video/x-sgi-movie"},
        {"mp2", "audio/mpeg"},
        {"mp3", "audio/mpeg"},
        {"mp4", "video/mp4"},
        {"mpe", "video/mpeg"},
        {"mpeg", "video/mpeg"},
        {"mpg", "video/mpeg"},
        {"mpga", "audio/mpeg"},
        {"ms", "application/x-troff-ms"},
        {"msh", "model/mesh"},
        {"mxu", "video/vnd.mpegurl"},
        {"nc", "application/x-netcdf"},
        {"oda", "application/oda"},
        {"ogg", "application/ogg"},
        {"pbm", "image/x-portable-bitmap"},
        {"pct", "image/pict"},
        {"pdb", "chemical/x-pdb"},
        {"pdf", "application/pdf"},
        {"pgm", "image/x-portable-graymap"},
        {"pgn", "application/x-chess-pgn"},
        {"pic", "image/pict"},
        {"pict", "image/pict"},
        {"png", "image/png"},
        {"pnm", "image/x-portable-anymap"},
        {"pnt", "image/x-macpaint"},
        {"pntg", "image/x-macpaint"},
        {"ppm", "image/x-portable-pixmap"},
        {"ppt", "application/vnd.ms-powerpoint"},
        {"pptx","application/vnd.openxmlformats-officedocument.presentationml.presentation"},
        {"potx","application/vnd.openxmlformats-officedocument.presentationml.template"},
        {"ppsx","application/vnd.openxmlformats-officedocument.presentationml.slideshow"},
        {"ppam","application/vnd.ms-powerpoint.addin.macroEnabled.12"},
        {"pptm","application/vnd.ms-powerpoint.presentation.macroEnabled.12"},
        {"potm","application/vnd.ms-powerpoint.template.macroEnabled.12"},
        {"ppsm","application/vnd.ms-powerpoint.slideshow.macroEnabled.12"},
        {"ps", "application/postscript"},
        {"qt", "video/quicktime"},
        {"qti", "image/x-quicktime"},
        {"qtif", "image/x-quicktime"},
        {"ra", "audio/x-pn-realaudio"},
        {"ram", "audio/x-pn-realaudio"},
        {"ras", "image/x-cmu-raster"},
        {"rdf", "application/rdf+xml"},
        {"rgb", "image/x-rgb"},
        {"rm", "application/vnd.rn-realmedia"},
        {"roff", "application/x-troff"},
        {"rtf", "text/rtf"},
        {"rtx", "text/richtext"},
        {"sgm", "text/sgml"},
        {"sgml", "text/sgml"},
        {"sh", "application/x-sh"},
        {"shar", "application/x-shar"},
        {"silo", "model/mesh"},
        {"sit", "application/x-stuffit"},
        {"skd", "application/x-koan"},
        {"skm", "application/x-koan"},
        {"skp", "application/x-koan"},
        {"skt", "application/x-koan"},
        {"smi", "application/smil"},
        {"smil", "application/smil"},
        {"snd", "audio/basic"},
        {"so", "application/octet-stream"},
        {"spl", "application/x-futuresplash"},
        {"src", "application/x-wais-source"},
        {"sv4cpio", "application/x-sv4cpio"},
        {"sv4crc", "application/x-sv4crc"},
        {"svg", "image/svg+xml"},
        {"swf", "application/x-shockwave-flash"},
        {"t", "application/x-troff"},
        {"tar", "application/x-tar"},
        {"tcl", "application/x-tcl"},
        {"tex", "application/x-tex"},
        {"texi", "application/x-texinfo"},
        {"texinfo", "application/x-texinfo"},
        {"tif", "image/tiff"},
        {"tiff", "image/tiff"},
        {"tr", "application/x-troff"},
        {"tsv", "text/tab-separated-values"},
        {"txt", "text/plain"},
        {"ustar", "application/x-ustar"},
        {"vcd", "application/x-cdlink"},
        {"vrml", "model/vrml"},
        {"vxml", "application/voicexml+xml"},
        {"wav", "audio/x-wav"},
        {"wbmp", "image/vnd.wap.wbmp"},
        {"wbmxl", "application/vnd.wap.wbxml"},
        {"wml", "text/vnd.wap.wml"},
        {"wmlc", "application/vnd.wap.wmlc"},
        {"wmls", "text/vnd.wap.wmlscript"},
        {"wmlsc", "application/vnd.wap.wmlscriptc"},
        {"wrl", "model/vrml"},
        {"xbm", "image/x-xbitmap"},
        {"xht", "application/xhtml+xml"},
        {"xhtml", "application/xhtml+xml"},
        {"xls", "application/vnd.ms-excel"},
        {"xml", "application/xml"},
        {"xpm", "image/x-xpixmap"},
        {"xsl", "application/xml"},
        {"xlsx","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
        {"xltx","application/vnd.openxmlformats-officedocument.spreadsheetml.template"},
        {"xlsm","application/vnd.ms-excel.sheet.macroEnabled.12"},
        {"xltm","application/vnd.ms-excel.template.macroEnabled.12"},
        {"xlam","application/vnd.ms-excel.addin.macroEnabled.12"},
        {"xlsb","application/vnd.ms-excel.sheet.binary.macroEnabled.12"},
        {"xslt", "application/xslt+xml"},
        {"xul", "application/vnd.mozilla.xul+xml"},
        {"xwd", "image/x-xwindowdump"},
        {"xyz", "chemical/x-xyz"},
        {"zip", "application/zip"}
      };

        public static string GetMIMEType(string fileName)
        {
            //get file extension
            string extension = System.IO.Path.GetExtension(fileName).ToLowerInvariant();

            if (extension.Length > 0 &&
                MIMETypesDictionary.ContainsKey(extension.Remove(0, 1)))
            {
                return MIMETypesDictionary[extension.Remove(0, 1)];
            }
            return "unknown/unknown";
        }

        public static string GetFileSize(long fileLength)
        {
            string result = string.Empty;

            var fileSizeKB = (fileLength / 1024);
            result = fileSizeKB.ToString("N") + " KB";
            if (fileSizeKB >= 1024)
            {
                var fileSizeMB = (fileSizeKB / 1024);
                result = fileSizeMB.ToString("N") + " MB";

                if (fileSizeMB >= 1024)
                {
                    var fileSizeGB = (fileSizeMB / 1024);
                    result = fileSizeGB.ToString("N") + " GB";
                }
            }

            return result;
        }

        public static EntityReference GetTag(IOrganizationService service, string tag)
        {
            EntityReference result = null;

            QueryExpression exp = new QueryExpression("bcgov_tag");
            exp.NoLock = true;
            exp.Criteria.AddCondition("bcgov_name", ConditionOperator.Equal, tag);
            exp.Criteria.AddCondition("statecode", ConditionOperator.Equal, 0); //Active

            var coll = service.RetrieveMultiple(exp);
            if (coll != null && coll.Entities != null && coll.Entities.Count > 0)
                result = coll.Entities[0].ToEntityReference();

            return result;
        }

        public static bool CheckInputParameter(IPluginExecutionContext context, string param)
        {
            if (!context.InputParameters.Contains(param))
                return false;

            if (context.InputParameters[param] == null)
                return false;

            return true;
        }

        public static QueryExpression ConvertFetchXMLToQueryExpression(IOrganizationService service, string fetchXML, int page, int count, string pagingCookie)
        {
            FetchExpression fetchExpression = new FetchExpression(fetchXML);
            FetchXmlToQueryExpressionRequest fetchXmlToQueryExpressionRequest = new FetchXmlToQueryExpressionRequest()
            {
                FetchXml = fetchExpression.Query
            };
            FetchXmlToQueryExpressionResponse fetchXmlToQueryExpressionResponse = (service.Execute(fetchXmlToQueryExpressionRequest) as FetchXmlToQueryExpressionResponse);
            QueryExpression queryExpression = fetchXmlToQueryExpressionResponse.Query;

            queryExpression.PageInfo = new PagingInfo();
            queryExpression.PageInfo.PageNumber = page;
            queryExpression.PageInfo.Count = count;
            if(!string.IsNullOrEmpty(pagingCookie))
                queryExpression.PageInfo.PagingCookie = pagingCookie;

            return queryExpression;
        }
    
        public static EntityCollection GetNoReplyQueue(IOrganizationService service)
        {
            EntityCollection result = new EntityCollection();
            result.EntityName = "activityparty";

            var queueEntity = service.Retrieve("queue", new Guid("35baed87-a0e0-ed11-b841-00505683fbf4"), new ColumnSet("emailaddress")); //<No-Reply Queue>

            Entity activityPartyEntity = new Entity("activityparty");
            activityPartyEntity["addressused"] = queueEntity.Contains("emailaddress") ? queueEntity["emailaddress"].ToString() : "";
            activityPartyEntity["partyid"] = new EntityReference("queue", queueEntity.Id);
            result.Entities.Add(activityPartyEntity);

            return result;
        }
    }
}
