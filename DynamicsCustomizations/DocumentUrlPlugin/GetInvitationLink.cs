using System;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;
using System.Net.Http;
using System.Net.Http.Headers;

namespace BCGOV.Plugin.DocumentUrl
{
    public class GetInvitationLink : IPlugin
    {
        // Called on Create of Portal Invitation record
        public void Execute(IServiceProvider serviceProvider)
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
                    var portalInvitation = (Entity)context.InputParameters["Target"];
                    var portalInvitationId = portalInvitation.GetAttributeValue<Guid>("ecer_portalinvitationid");
                    var characterRef = portalInvitation.GetAttributeValue<EntityReference>("ecer_characterreferenceid");
                    var workExpRef = portalInvitation.GetAttributeValue<EntityReference>("ecer_workexperiencereferenceid");
                    var programRepRef = portalInvitation.GetAttributeValue<EntityReference>("ecer_psiprogramrepresentativeid");
                    var validDays = portalInvitation.GetAttributeValue<int>("ecer_validdays");
                    
                    var inviteType = string.Empty;
                    Entity referenceEntity = null;
                    EntityReference referenceER = null;
                    if (characterRef == null && workExpRef == null && programRepRef == null)
                    {
                        return;
                    }
                    else if (characterRef != null)
                    {
                        inviteType = "CharacterReference";
                        referenceER = characterRef;
                    }
                    else if (workExpRef != null)
                    {
                        inviteType = "WorkExperienceReference";
                        referenceER = workExpRef;
                    }
                    else if (programRepRef != null)
                    {
                        inviteType = "PSIProgramRepresentative";
                        referenceER = programRepRef;
                    }
                    else
                    {
                        return; // 
                    }
                    traceService.Trace($"Line 59 - Invite Type: {inviteType} || Reference Logical Name: {referenceER.LogicalName} || Reference ID: {referenceER.Id}");
                    referenceEntity = service.Retrieve(referenceER.LogicalName, referenceER.Id, new Microsoft.Xrm.Sdk.Query.ColumnSet(true));
                    var firstName = referenceEntity.GetAttributeValue<string>("ecer_firstname");
                    var lastName = referenceEntity.GetAttributeValue<string>("ecer_lastname");
                    var emailaddress = referenceEntity.GetAttributeValue<string>("ecer_emailaddress");
                    var configs = Helpers.GetSystemConfigurations(service, "Storage", string.Empty);
                    traceService.Trace($"First Name: {firstName} || Last Name: {lastName} || Email Address {emailaddress} || configs: {configs}");
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
                    url = url + "/api/invitelinks/";
                    traceService.Trace($"URL: {url}");
                    using (var client = new HttpClient())
                    {
                        client.DefaultRequestHeaders.Add("Authorization", "Bearer " + bearerToken);
                        
                        
                        var id = portalInvitationId.ToString("D");
                        //var payloadJSON = "{\"portalInvitation\":\"" + id + $"\",\"inviteType\":\"{inviteType}\",\"validDays\":{validDays}" + "}";
                        var payloadJSON = "{\"portalInvitation\":\"" + id + $"\",\"validDays\":{validDays}" + "}"; // Remove Invite Type to make it more generic
                        traceService.Trace($"payloadJSON: {payloadJSON}");
                        traceService.Trace("Call API to get invitation link");
                        var stringContent = new StringContent(payloadJSON, System.Text.Encoding.UTF8, "application/json");
                        traceService.Trace($"String Content: {stringContent.ToString()}");
                        var response = client.PostAsync(url, stringContent).Result;
                        traceService.Trace($"Response: {response.StatusCode}");
                        if (response.StatusCode == System.Net.HttpStatusCode.OK ||
                            response.StatusCode == System.Net.HttpStatusCode.Created)
                        {
                            // Set URL Link and flag to send mail
                            traceService.Trace("Got Response");
                            var httpResponse = response.Content.ReadAsStringAsync().Result;
                            traceService.Trace("JSON Reader");
                            var jsonReader = System.Runtime.Serialization.Json.JsonReaderWriterFactory.CreateJsonReader(System.Text.Encoding.UTF8.GetBytes(httpResponse), new System.Xml.XmlDictionaryReaderQuotas());
                            traceService.Trace("Try to get InviteLink element");
                            var root = System.Xml.Linq.XElement.Load(jsonReader);
                            if (root.Element("inviteLink") != null)
                            {
                                var link = root.Element("inviteLink").Value;
                                traceService.Trace($"LINK: {link}");
                                var portalInviteWrite = new Entity("ecer_portalinvitation");
                                portalInviteWrite["ecer_portalinvitationid"] = portalInvitationId;
                                portalInviteWrite["ecer_invitationlink"] = link;
                                portalInviteWrite["ecer_firstname"] = firstName;
                                portalInviteWrite["ecer_lastname"] = lastName;
                                portalInviteWrite["ecer_emailaddress"] = emailaddress;
                                traceService.Trace("Update Portal Invitation Entity");
                                service.Update(portalInviteWrite);
                            }
                            isSuccess = true;
                        }
                        else
                        {
                            traceService.Trace($"Not Success");
                            traceService.Trace($"Response Request Message: {response.RequestMessage}");
                            traceService.Trace($"Response Reason Phrase: {response.ReasonPhrase}");
                            traceService.Trace($"Response Headers: {response.Headers.ToString()}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
                userMessage = "An error occurred in the Get Invitation Link Plugin.." + ex.Message;
            }
            finally
            {
                context.OutputParameters["IsSuccess"] = isSuccess;

                if (!string.IsNullOrEmpty(userMessage))
                    context.OutputParameters["Result"] = userMessage;
            }
        }
    }

    [Serializable]
    public class PortalInvitationRequest
    {
        public string portalInvitation { get; set; }
        public string inviteType { get; set; }
        public int validDays { get; set; }
    }
}
