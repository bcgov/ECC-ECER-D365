using System;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;
using System.Net.Http;
using System.Net.Http.Headers;

namespace BCGOV.Plugin.DocumentUrl
{
    public class UpdateTagsToSharePoint : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            IPluginExecutionContext context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            IOrganizationServiceFactory serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            ITracingService traceService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

            traceService.Trace("Initializing plugin..");

            try
            {
                if (context.InputParameters == null)
                    return;
                if (!context.InputParameters.Contains("Target"))
                    return;
                if (!(context.InputParameters["Target"] is Entity))
                    return;

                var targetEntity = context.InputParameters["Target"] as Entity;

                string tag1 = string.Empty;
                string tag2 = string.Empty;
                string tag3 = string.Empty;
                string regardingObjectLogicalName = string.Empty;
                string regardingObjectId = string.Empty;
                string classification = string.Empty;
                string fileFolder = string.Empty;
                if (context.PostEntityImages.Contains("PostImage") && context.PostEntityImages["PostImage"] is Entity)
                {
                    var postEntity = context.PostEntityImages["PostImage"] as Entity;

                    if (postEntity.Contains("bcgov_url") && postEntity["bcgov_url"] != null)
                        fileFolder = postEntity["bcgov_url"].ToString();

                    if (postEntity.Contains("bcgov_tag1id") && postEntity["bcgov_tag1id"] != null)
                        tag1 = ((EntityReference)postEntity["bcgov_tag1id"]).Name;

                    if (postEntity.Contains("bcgov_tag2id") && postEntity["bcgov_tag2id"] != null)
                        tag2 = ((EntityReference)postEntity["bcgov_tag2id"]).Name;

                    if (postEntity.Contains("bcgov_tag3id") && postEntity["bcgov_tag3id"] != null)
                        tag3 = ((EntityReference)postEntity["bcgov_tag3id"]).Name;

                    if (postEntity.Contains("bcgov_caseid") && postEntity["bcgov_caseid"] != null)
                    {
                        regardingObjectLogicalName = ((EntityReference)postEntity["bcgov_caseid"]).LogicalName;
                        regardingObjectId = ((EntityReference)postEntity["bcgov_caseid"]).Id.ToString();
                    }
                    else if (postEntity.Contains("bcgov_emailid") && postEntity["bcgov_emailid"] != null)
                    {
                        regardingObjectLogicalName = ((EntityReference)postEntity["bcgov_emailid"]).LogicalName;
                        regardingObjectId = ((EntityReference)postEntity["bcgov_emailid"]).Id.ToString();
                    }
                    else if (postEntity.Contains("bcgov_faxid") && postEntity["bcgov_faxid"] != null)
                    {
                        regardingObjectLogicalName = ((EntityReference)postEntity["bcgov_faxid"]).LogicalName;
                        regardingObjectId = ((EntityReference)postEntity["bcgov_faxid"]).Id.ToString();
                    }
                    else if (postEntity.Contains("bcgov_letterid") && postEntity["bcgov_letterid"] != null)
                    {
                        regardingObjectLogicalName = ((EntityReference)postEntity["bcgov_letterid"]).LogicalName;
                        regardingObjectId = ((EntityReference)postEntity["bcgov_letterid"]).Id.ToString();
                    }
                    else if (postEntity.Contains("bcgov_appointmentid") && postEntity["bcgov_appointmentid"] != null)
                    {
                        regardingObjectLogicalName = ((EntityReference)postEntity["bcgov_appointmentid"]).LogicalName;
                        regardingObjectId = ((EntityReference)postEntity["bcgov_appointmentid"]).Id.ToString();
                    }
                    else if (postEntity.Contains("bcgov_taskid") && postEntity["bcgov_taskid"] != null)
                    {
                        regardingObjectLogicalName = ((EntityReference)postEntity["bcgov_taskid"]).LogicalName;
                        regardingObjectId = ((EntityReference)postEntity["bcgov_taskid"]).Id.ToString();
                    }
                    else if (postEntity.Contains("bcgov_phonecallid") && postEntity["bcgov_phonecallid"] != null)
                    {
                        regardingObjectLogicalName = ((EntityReference)postEntity["bcgov_phonecallid"]).LogicalName;
                        regardingObjectId = ((EntityReference)postEntity["bcgov_phonecallid"]).Id.ToString();
                    }
                    else if (postEntity.Contains("bcgov_customer") && postEntity["bcgov_customer"] != null)
                    {
                        regardingObjectLogicalName = ((EntityReference)postEntity["bcgov_customer"]).LogicalName;
                        regardingObjectId = ((EntityReference)postEntity["bcgov_customer"]).Id.ToString();
                    }

                    if (postEntity.FormattedValues.Contains("bcgov_fileclassification") && !string.IsNullOrEmpty(postEntity.FormattedValues["bcgov_fileclassification"]))
                        classification = postEntity.FormattedValues["bcgov_fileclassification"];
                }

                if (string.IsNullOrEmpty(tag1) &&
                    string.IsNullOrEmpty(tag2) &&
                    string.IsNullOrEmpty(tag3) &&
                    string.IsNullOrEmpty(regardingObjectLogicalName) &&
                    string.IsNullOrEmpty(regardingObjectId) &&
                    string.IsNullOrEmpty(classification))
                    return;

                var configs = Helpers.GetSystemConfigurations(service, "Storage", string.Empty);

                string authUrl = Helpers.GetConfigKeyValue(configs, "AuthUrl", "Storage");
                string authSecret = Helpers.GetSecureConfigKeyValue(configs, "AuthSecret", "Storage");
                string authClientId = Helpers.GetSecureConfigKeyValue(configs, "AuthClientId", "Storage");
                string url = Helpers.GetConfigKeyValue(configs, "InterfaceUrl", "Storage");

                var bearerToken = Helpers.GetBearerToken(authUrl, authClientId, authSecret);

                url = url + "/api/files/" + targetEntity.Id.ToString() + "/tags";

                using (var client = new HttpClient())
                {
                    client.DefaultRequestHeaders.Add("Authorization", "Bearer " + bearerToken);
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    if (!string.IsNullOrEmpty(fileFolder))
                        client.DefaultRequestHeaders.Add("file-folder", fileFolder);

                    if (!string.IsNullOrEmpty(classification))
                        client.DefaultRequestHeaders.Add("file-classification", classification);
                    if (!string.IsNullOrEmpty(regardingObjectLogicalName) && !string.IsNullOrEmpty(regardingObjectId))
                        client.DefaultRequestHeaders.Add("file-tag", string.Format("RegardingEntity={0},RegardingObjectId={1}", regardingObjectLogicalName, regardingObjectId.ToString()));
                    if (!string.IsNullOrEmpty(tag1))
                        client.DefaultRequestHeaders.Add("file-tag", "Tag1=" + tag1);
                    if (!string.IsNullOrEmpty(tag2))
                        client.DefaultRequestHeaders.Add("file-tag", "Tag2=" + tag2);
                    if (!string.IsNullOrEmpty(tag3))
                        client.DefaultRequestHeaders.Add("file-tag", "Tag3=" + tag3);

                    var response = client.PostAsync(url, null).Result;
                    if (response.StatusCode != System.Net.HttpStatusCode.OK)
                        throw new InvalidPluginExecutionException(response.StatusCode.ToString());
                }
            }
            catch (FaultException<OrganizationServiceFault> ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
            }
            catch (Exception ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
            }
        }
    }
}
