using System;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System.Net.Http;

namespace BCGOV.Plugin.DocumentUrl
{
    public class DeleteDocumentFromSharePoint : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            IPluginExecutionContext context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            IOrganizationServiceFactory serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            ITracingService traceService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

            traceService.Trace("Initializing action..");

            string fileContent = string.Empty;
            string fileName = string.Empty;
            string mimeType = string.Empty;
            long fileLength = 0;
            DateTime receivedDate = DateTime.Now;
            bool isSuccess = false;
            string userMessage = string.Empty;
            EntityReference documentURLER = null;

            try
            {
                if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is EntityReference)
                {
                    EntityReference target = context.InputParameters["Target"] as EntityReference;

                    var documentEntity = service.Retrieve("bcgov_documenturl", target.Id, new ColumnSet(true));

                    if (documentEntity.Contains("bcgov_filename") && !string.IsNullOrEmpty(documentEntity["bcgov_filename"].ToString()))
                        fileName = documentEntity["bcgov_filename"].ToString();

                    if (!string.IsNullOrEmpty(fileName))
                        mimeType = Helpers.GetMIMEType(fileName);

                    if (documentEntity.Contains("bcgov_receiveddate"))
                        receivedDate = ((DateTime)documentEntity["bcgov_receiveddate"]).ToLocalTime();

                    if (documentEntity.Contains("ecer_fromdocumenturlid"))
                        documentURLER = documentEntity.GetAttributeValue<EntityReference>("ecer_fromdocumenturlid");

                    var configs = Helpers.GetSystemConfigurations(service, "Storage", string.Empty);

                    string authUrl = Helpers.GetConfigKeyValue(configs, "AuthUrl", "Storage");
                    string authSecret = Helpers.GetSecureConfigKeyValue(configs, "AuthSecret", "Storage");
                    string authClientId = Helpers.GetSecureConfigKeyValue(configs, "AuthClientId", "Storage");
                    string url = Helpers.GetConfigKeyValue(configs, "InterfaceUrl", "Storage");
                    string defaultStorageApplication = "Registry";
                    var bearerToken = Helpers.GetBearerToken(authUrl, authClientId, authSecret);
                    var pathToFile = "/api/files/" + documentEntity.Id.ToString();
                    if (documentURLER != null)
                    {
                        pathToFile = "/api/files/" + documentURLER.Id.ToString();
                    }
                    url = url + pathToFile;

                    using (var client = new HttpClient())
                    {
                        client.DefaultRequestHeaders.Add("Authorization", "Bearer " + bearerToken);
                        if (documentEntity.Contains("bcgov_url"))
                            client.DefaultRequestHeaders.Add("file-folder", documentEntity["bcgov_url"].ToString());
                        if (documentEntity.Contains("ecer_applicationname"))
                        {
                            defaultStorageApplication = documentEntity["ecer_applicationname"].ToString();
                        }
                        client.DefaultRequestHeaders.Add("application", defaultStorageApplication);
                        traceService.Trace($"URL: {url}");
                        traceService.Trace($"Request Header - application: {defaultStorageApplication}");
                        traceService.Trace($"Request Header - file-folder: {documentEntity["bcgov_url"].ToString()}");
                        var response = client.GetAsync(url).Result;
                        traceService.Trace($"HTTP Status Code: {response.StatusCode.ToString()}");
                        if (!(response.StatusCode == System.Net.HttpStatusCode.OK))
                        {
                            throw new InvalidPluginExecutionException(response.StatusCode.ToString());
                        }

                    }

                    isSuccess = true;
                }
                else
                    userMessage = "Target is not a Document Url..";
            }
            catch (FaultException<OrganizationServiceFault> ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
                userMessage = "An error occurred in the Delete Document Plugin." + ex.Message;
            }
            catch (Exception ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
                userMessage = "An error occurred in the Delete Document Plugin." + ex.Message;
            }
        }
    }
}
