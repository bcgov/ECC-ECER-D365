using System;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;
using System.Net.Http;
using System.Net.Http.Headers;

namespace BCGOV.Plugin.DocumentUrl
{
    public class UploadDocumentToSharePoint : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            IPluginExecutionContext context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            IOrganizationServiceFactory serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            ITracingService traceService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

            traceService.Trace("Initializing action..");

            bool isSuccess = false;
            string userMessage = string.Empty;
            try
            {
                if (context.InputParameters.Contains("FileName") && !string.IsNullOrEmpty(context.InputParameters["FileName"].ToString()) &&
                    context.InputParameters.Contains("Body") && !string.IsNullOrEmpty(context.InputParameters["Body"].ToString()) &&
                    context.InputParameters.Contains("RegardingObjectId") && !string.IsNullOrEmpty(context.InputParameters["RegardingObjectId"].ToString()) &&
                    context.InputParameters.Contains("RegardingObjectName") && !string.IsNullOrEmpty(context.InputParameters["RegardingObjectName"].ToString()))
                {
                    string fileName = context.InputParameters["FileName"].ToString();
                    string body = context.InputParameters["Body"].ToString();
                    string regardingObjectLogicalName = context.InputParameters["RegardingObjectName"].ToString();
                    Guid regardingObjectId = new Guid(context.InputParameters["RegardingObjectId"].ToString());
                    traceService.Trace($"Body Length: {body.Length}");
                    string tag1 = string.Empty;
                    string tag2 = string.Empty;
                    string tag3 = string.Empty;
                    if (context.InputParameters.Contains("Tag1") && context.InputParameters["Tag1"] != null)
                        tag1 = context.InputParameters["Tag1"].ToString();
                    if (context.InputParameters.Contains("Tag2") && context.InputParameters["Tag2"] != null)
                        tag2 = context.InputParameters["Tag2"].ToString();
                    if (context.InputParameters.Contains("Tag3") && context.InputParameters["Tag3"] != null)
                        tag3 = context.InputParameters["Tag3"].ToString();

                    var configs = Helpers.GetSystemConfigurations(service, "Storage", string.Empty);

                    string authUrl = Helpers.GetConfigKeyValue(configs, "AuthUrl", "Storage");
                    string authSecret = Helpers.GetSecureConfigKeyValue(configs, "AuthSecret", "Storage");
                    string authClientId = Helpers.GetSecureConfigKeyValue(configs, "AuthClientId", "Storage");
                    string url = Helpers.GetConfigKeyValue(configs, "InterfaceUrl", "Storage");
                    traceService.Trace($"authURL: {authUrl}");
                    traceService.Trace($"authSecret: {authSecret}");
                    traceService.Trace($"authClientId: {authClientId}");
                    traceService.Trace($"Interface URL: {url}");
                    traceService.Trace("Convert Base64 String into Byte Array for further processing");
                    var bodyByteArray = Convert.FromBase64String(body);

                    using (var fileStream = new System.IO.MemoryStream(bodyByteArray))
                    {
                        if (fileStream.Length <= 16384) //16KB
                        {
                            if (fileName.EndsWith(".png", StringComparison.InvariantCultureIgnoreCase))
                            {
                                isSuccess = true;
                                return;
                            }
                        }
                        traceService.Trace($"Construct File Stream Length: {fileStream.Length}");
                        Entity sharePointFileUrlEntity = new Entity("bcgov_documenturl");
                        sharePointFileUrlEntity["bcgov_filename"] = fileName;
                        sharePointFileUrlEntity["bcgov_receiveddate"] = DateTime.Now;
                        sharePointFileUrlEntity["bcgov_filesize"] = Helpers.GetFileSize(fileStream.Length);
                        sharePointFileUrlEntity["bcgov_fileextension"] = fileName.Substring(fileName.LastIndexOf("."));
                        sharePointFileUrlEntity["bcgov_url"] = string.Format("{0}/{1}", regardingObjectLogicalName, regardingObjectId.ToString());

                        if (!string.IsNullOrEmpty(tag1))
                        {
                            var tagReference = Helpers.GetTag(service, tag1);
                            sharePointFileUrlEntity["bcgov_tag1id"] = tagReference;
                        }
                        if (!string.IsNullOrEmpty(tag2))
                        {
                            var tagReference = Helpers.GetTag(service, tag2);
                            sharePointFileUrlEntity["bcgov_tag2id"] = tagReference;
                        }
                        if (!string.IsNullOrEmpty(tag3))
                        {
                            var tagReference = Helpers.GetTag(service, tag3);
                            sharePointFileUrlEntity["bcgov_tag3id"] = tagReference;
                        }

                        if (context.InputParameters.Contains("Origin") && context.InputParameters["Origin"] != null)
                            sharePointFileUrlEntity["bcgov_origincode"] = context.InputParameters["Origin"];

                        Guid? documentId = null;
                        if (context.InputParameters.Contains("DocumentId") && context.InputParameters["DocumentId"] != null)
                        {
                            documentId = new Guid(context.InputParameters["DocumentId"].ToString());
                            sharePointFileUrlEntity.Id = documentId.Value;
                        }
                        else
                            sharePointFileUrlEntity.Id = Guid.NewGuid();

                        if (regardingObjectLogicalName.Equals("account", StringComparison.InvariantCultureIgnoreCase) || regardingObjectLogicalName.Equals("contact", StringComparison.InvariantCultureIgnoreCase))
                        {
                            sharePointFileUrlEntity["bcgov_customer"] = new EntityReference(regardingObjectLogicalName, regardingObjectId);
                        }
                        else if (regardingObjectLogicalName.Equals("incident", StringComparison.InvariantCultureIgnoreCase))
                        {
                            sharePointFileUrlEntity["bcgov_caseid"] = new EntityReference(regardingObjectLogicalName, regardingObjectId);
                        }
                        else if (regardingObjectLogicalName.Equals("email", StringComparison.InvariantCultureIgnoreCase))
                        {
                            sharePointFileUrlEntity["bcgov_emailid"] = new EntityReference(regardingObjectLogicalName, regardingObjectId);
                        }
                        else if (regardingObjectLogicalName.Equals("fax", StringComparison.InvariantCultureIgnoreCase))
                        {
                            sharePointFileUrlEntity["bcgov_faxid"] = new EntityReference(regardingObjectLogicalName, regardingObjectId);
                        }
                        else if (regardingObjectLogicalName.Equals("letter", StringComparison.InvariantCultureIgnoreCase))
                        {
                            sharePointFileUrlEntity["bcgov_letterid"] = new EntityReference(regardingObjectLogicalName, regardingObjectId);
                        }
                        else if (regardingObjectLogicalName.Equals("appointment", StringComparison.InvariantCultureIgnoreCase))
                        {
                            sharePointFileUrlEntity["bcgov_appointmentid"] = new EntityReference(regardingObjectLogicalName, regardingObjectId);
                        }
                        else if (regardingObjectLogicalName.Equals("task", StringComparison.InvariantCultureIgnoreCase))
                        {
                            sharePointFileUrlEntity["bcgov_taskid"] = new EntityReference(regardingObjectLogicalName, regardingObjectId);
                        }
                        else if (regardingObjectLogicalName.Equals("phonecall", StringComparison.InvariantCultureIgnoreCase))
                        {
                            sharePointFileUrlEntity["bcgov_phonecallid"] = new EntityReference(regardingObjectLogicalName, regardingObjectId);
                        }
                        else if (regardingObjectLogicalName.Equals("ecer_application", StringComparison.InvariantCultureIgnoreCase))
                        {
                            sharePointFileUrlEntity["ecer_applicationid"] = new EntityReference(regardingObjectLogicalName, regardingObjectId);
                        }
                        else if (regardingObjectLogicalName.Equals("ecer_investigation", StringComparison.InvariantCultureIgnoreCase))
                        {
                            sharePointFileUrlEntity["ecer_investigationid"] = new EntityReference(regardingObjectLogicalName, regardingObjectId);
                        }
                        else if (regardingObjectLogicalName.Equals("ecer_certificate", StringComparison.InvariantCultureIgnoreCase))
                        {
                            sharePointFileUrlEntity["ecer_certificateid"] = new EntityReference(regardingObjectLogicalName, regardingObjectId);
                        }
                        else if (regardingObjectLogicalName.Equals("ecer_investigationplanninginterview", StringComparison.InvariantCultureIgnoreCase))
                        {
                            sharePointFileUrlEntity["ecer_investigationinterviewid"] = new EntityReference(regardingObjectLogicalName, regardingObjectId);
                        }
                        else if (regardingObjectLogicalName.Equals("ecer_postsecondaryinstitutesitevisit", StringComparison.InvariantCultureIgnoreCase))
                        {
                            sharePointFileUrlEntity["ecer_pspsitevisitid"] = new EntityReference(regardingObjectLogicalName, regardingObjectId);
                        }
                        else if (regardingObjectLogicalName.Equals("ecer_communication", StringComparison.InvariantCultureIgnoreCase))
                        {
                            sharePointFileUrlEntity["ecer_communicationid"] = new EntityReference(regardingObjectLogicalName, regardingObjectId);
                        }
                        else
                            throw new InvalidPluginExecutionException(string.Format("Unknown RegardingObjectType '{0}' to associate document..", regardingObjectLogicalName));
                        traceService.Trace("Constructed Document URL entity");
                        traceService.Trace("Preparing API call contents");
                        MultipartFormDataContent multipartContent = new MultipartFormDataContent();

                        fileStream.Position = 0;
                        var streamContent = new StreamContent(fileStream);
                        streamContent.Headers.ContentType = System.Net.Http.Headers.MediaTypeHeaderValue.Parse(Helpers.GetMIMEType(fileName));
                        multipartContent.Add(streamContent, "File", fileName);

                        var bearerToken = Helpers.GetBearerToken(authUrl, authClientId, authSecret);

                        url = url + "/api/files/" + sharePointFileUrlEntity.Id.ToString();

                        using (var client = new HttpClient())
                        {
                            client.DefaultRequestHeaders.Add("Authorization", "Bearer " + bearerToken);
                            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("multipart/form-data"));
                            client.DefaultRequestHeaders.Add("file-classification", "Unclassified");
                            client.DefaultRequestHeaders.Add("file-folder", string.Format("{0}/{1}", regardingObjectLogicalName, regardingObjectId.ToString()));
                            
                            if (!string.IsNullOrEmpty(tag1))
                                client.DefaultRequestHeaders.Add("file-tag", "Tag1=" + tag1);
                            if (!string.IsNullOrEmpty(tag2))
                                client.DefaultRequestHeaders.Add("file-tag", "Tag2=" + tag2);
                            if (!string.IsNullOrEmpty(tag3))
                                client.DefaultRequestHeaders.Add("file-tag", "Tag3=" + tag3);
                            traceService.Trace("Call API to upload document");
                            var response = client.PostAsync(url, multipartContent).Result;
                            traceService.Trace($"Response: {response.StatusCode}");
                            if (response.StatusCode == System.Net.HttpStatusCode.OK ||
                                response.StatusCode == System.Net.HttpStatusCode.Created)
                            {
                                if (documentId.HasValue)
                                    service.Update(sharePointFileUrlEntity);
                                else
                                    service.Create(sharePointFileUrlEntity);

                                isSuccess = true;
                                userMessage = sharePointFileUrlEntity.Id.ToString();
                            }
                            else
                                userMessage = response.StatusCode.ToString();
                        }
                    }
                }
            }
            catch (FaultException<OrganizationServiceFault> ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
                userMessage = "An error occurred in the UploadDocument Action.." + ex.Message;
            }
            catch (Exception ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
                userMessage = "An error occurred in the UploadDocument Action.." + ex.Message;
            }
            finally
            {
                context.OutputParameters["IsSuccess"] = isSuccess;

                if (!string.IsNullOrEmpty(userMessage))
                    context.OutputParameters["Result"] = userMessage;
            }
        }
    }
}
