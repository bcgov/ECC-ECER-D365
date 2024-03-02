using System;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System.Net.Http;

namespace BCGOV.Plugin.DocumentUrl
{
    public class DownloadDocumentFromSharePoint : IPlugin
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

            try
            {
                if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is EntityReference)
                {
                    EntityReference target = context.InputParameters["Target"] as EntityReference;

                    var documentEntity = service.Retrieve("bcgov_documenturl", target.Id, new ColumnSet("bcgov_filename", "bcgov_receiveddate", "bcgov_url"));

                    if (documentEntity.Contains("bcgov_filename") && !string.IsNullOrEmpty(documentEntity["bcgov_filename"].ToString()))
                        fileName = documentEntity["bcgov_filename"].ToString();

                    if (!string.IsNullOrEmpty(fileName))
                        mimeType = Helpers.GetMIMEType(fileName);

                    if (documentEntity.Contains("bcgov_receiveddate"))
                        receivedDate = ((DateTime)documentEntity["bcgov_receiveddate"]).ToLocalTime();

                    var configs = Helpers.GetSystemConfigurations(service, "Storage", string.Empty);

                    string authUrl = Helpers.GetConfigKeyValue(configs, "AuthUrl", "Storage");
                    string authSecret = Helpers.GetSecureConfigKeyValue(configs, "AuthSecret", "Storage");
                    string authClientId = Helpers.GetSecureConfigKeyValue(configs, "AuthClientId", "Storage");
                    string url = Helpers.GetConfigKeyValue(configs, "InterfaceUrl", "Storage");

                    var bearerToken = Helpers.GetBearerToken(authUrl, authClientId, authSecret);

                    url = url + "/api/files/" + documentEntity.Id.ToString();

                    using (var client = new HttpClient())
                    {
                        client.DefaultRequestHeaders.Add("Authorization", "Bearer " + bearerToken);
                        if(documentEntity.Contains("bcgov_url"))
                            client.DefaultRequestHeaders.Add("file-folder", documentEntity["bcgov_url"].ToString());

                        var response = client.GetAsync(url).Result;

                        if (response.StatusCode == System.Net.HttpStatusCode.OK)
                        {
                            using (System.IO.MemoryStream fileStream = new System.IO.MemoryStream())
                            {
                                response.Content.CopyToAsync(fileStream).Wait(90000); //1.5 minute

                                fileContent = Convert.ToBase64String(fileStream.ToArray());

                                fileLength = fileStream.Length / 1024;
                            }
                        }
                        else
                            throw new InvalidPluginExecutionException(response.StatusCode.ToString());
                    }

                    isSuccess = true;
                }
                else
                    userMessage = "Target is not a Document Url..";
            }
            catch (FaultException<OrganizationServiceFault> ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
                userMessage = "An error occurred in the DownloadDocument Action.." + ex.Message;
            }
            catch (Exception ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
                userMessage = "An error occurred in the DownloadDocument Action.." + ex.Message;
            }
            finally
            {
                if (!string.IsNullOrEmpty(fileContent))
                    context.OutputParameters["Body"] = fileContent;

                if (!string.IsNullOrEmpty(fileName))
                    context.OutputParameters["FileName"] = fileName;

                if (!string.IsNullOrEmpty(mimeType))
                    context.OutputParameters["MimeType"] = mimeType;

                context.OutputParameters["ReceivedDate"] = receivedDate;
                context.OutputParameters["FileSize"] = fileLength.ToString();
                context.OutputParameters["IsSuccess"] = isSuccess;

                if (!string.IsNullOrEmpty(userMessage))
                    context.OutputParameters["Result"] = userMessage;
            }
        }
    }
}
