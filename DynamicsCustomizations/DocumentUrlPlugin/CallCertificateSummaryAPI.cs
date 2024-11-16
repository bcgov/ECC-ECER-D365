using System;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;
using System.Net.Http;
using System.Net.Http.Headers;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Crm.Sdk.Messages;

namespace BCGOV.Plugin.DocumentUrl
{
    public class CallCertificateSummaryAPI : IPlugin
    {
        // Called on Record Ready.
        // No need to Call the API, just deactivate all other records.
        public async void Execute(IServiceProvider serviceProvider)
        {
            var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            var service = serviceFactory.CreateOrganizationService(context.UserId);
            var traceService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));
            var userMessage = string.Empty;
            Boolean isSuccess = false;
            traceService.Trace("Initializing plugin..");
            try
            {
                
                if (context.InputParameters != null && context.InputParameters.Contains("Target"))
                {
                    var certificateSummary = (Entity)context.InputParameters["Target"];
                    var id = certificateSummary.GetAttributeValue<Guid>("ecer_certificatesummaryid");
                    var readyForAPI = certificateSummary.GetAttributeValue<bool>("ecer_readytocallapi");
                    
                    if (!readyForAPI)
                    {
                        // Only Care if Ready for API
                        return;
                    }

                    var query = new QueryExpression("ecer_certificatesummary") { ColumnSet = new ColumnSet(false) };
                    query.Criteria.AddCondition("ecer_certificatesummaryid", ConditionOperator.NotEqual, id);
                    query.Criteria.AddCondition("statecode", ConditionOperator.Equal, 0); // still active
                    var results = service.RetrieveMultiple(query);
                    foreach(var cs in results.Entities)
                    {
                        cs["statecode"] = new OptionSetValue(1); // Inactive
                        cs["statuscode"] = new OptionSetValue(2); // Inactive
                        service.Update(cs);
                    }
                    /*
                    var configs = Helpers.GetSystemConfigurations(service, "Storage", string.Empty);

                    string authUrl = Helpers.GetConfigKeyValue(configs, "AuthUrl", "Storage");
                    string authSecret = Helpers.GetSecureConfigKeyValue(configs, "AuthSecret", "Storage");
                    string authClientId = Helpers.GetSecureConfigKeyValue(configs, "AuthClientId", "Storage");
                    string url = Helpers.GetConfigKeyValue(configs, "InterfaceUrl", "Storage");
                    traceService.Trace($"authURL: {authUrl}");
                    traceService.Trace($"authSecret: {authSecret}");
                    traceService.Trace($"authClientId: {authClientId}");
                    traceService.Trace($"Interface URL: {url}");

                    var bearerToken = Helpers.GetBearerToken(authUrl, authClientId, authSecret);
                    traceService.Trace($"Bearer Token: {bearerToken}");
                    url = url + $"/api/certifications/file/{id.ToString("D")}";

                    using (var client = new HttpClient())
                    {
                        client.DefaultRequestHeaders.Add("Authorization", "Bearer " + bearerToken);
                        traceService.Trace($"Call api: {url}");
                        var response = await client.GetAsync(url);
                        traceService.Trace($"Response Status Code: {response.StatusCode} | {response.IsSuccessStatusCode}");
                        if (response.StatusCode == System.Net.HttpStatusCode.OK ||
                            response.StatusCode == System.Net.HttpStatusCode.Created)
                        {
                            // Handle the file
                            using (System.IO.MemoryStream fileStream = new System.IO.MemoryStream())
                            {
                                response.Content.CopyToAsync(fileStream).Wait(90000); //1.5 minute

                                fileContent = Convert.ToBase64String(fileStream.ToArray());

                                fileLength = fileStream.Length / 1024;
                            }
                            isSuccess = true;
                        }
                    }
                    */

                }
            }
            catch (Exception ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
                userMessage = "An error occurred in the Certificate Summary Plugin.." + ex.Message;
            }
            finally
            {
                traceService.Trace($"Response Is Success:{isSuccess}");
                context.OutputParameters["IsSuccess"] = isSuccess;

                if (!string.IsNullOrEmpty(userMessage))
                    context.OutputParameters["Result"] = userMessage;
            }
        }
    }
}
