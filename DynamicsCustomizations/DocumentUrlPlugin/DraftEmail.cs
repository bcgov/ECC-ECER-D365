using System;
using System.Collections.Generic;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace BCGOV.Plugin.DocumentUrl
{
    public class DraftEmail : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            IPluginExecutionContext context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            IOrganizationServiceFactory serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            ITracingService traceService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

            traceService.Trace("Initializing action..");

            string emailId = string.Empty;
            string result = string.Empty;
            try
            {
                #region Validations
                if (!context.InputParameters.Contains("Subject"))
                    throw new InvalidPluginExecutionException("Subject field is required..");
                if (context.InputParameters["Subject"] == null)
                    throw new InvalidPluginExecutionException("Subject field cannot be empty..");
                if (!context.InputParameters.Contains("RegardingObjectTypeName"))
                    throw new InvalidPluginExecutionException("RegardingObjectTypeName field is required..");
                if (context.InputParameters["RegardingObjectTypeName"] == null)
                    throw new InvalidPluginExecutionException("RegardingObjectTypeName field cannot be empty..");
                if (!context.InputParameters.Contains("RegardingObjectId"))
                    throw new InvalidPluginExecutionException("RegardingObjectId field is required..");
                if (context.InputParameters["RegardingObjectId"] == null)
                    throw new InvalidPluginExecutionException("RegardingObjectId field cannot be empty..");
                #endregion

                Entity emailEntity = new Entity("email");
                emailEntity.Id = Guid.NewGuid();
                emailEntity["from"] = GetFromActivityParty(service, context.UserId);
                emailEntity["subject"] = context.InputParameters["Subject"].ToString();
                emailEntity["regardingobjectid"] = GetRegardingObject(service, context.InputParameters["RegardingObjectTypeName"].ToString(), Guid.Parse(context.InputParameters["RegardingObjectId"].ToString()));

                if (context.InputParameters.Contains("DocumentIds") && context.InputParameters["DocumentIds"] != null)
                {
                    List<Entity> attachments = new List<Entity>();
                    var documentIdList = context.InputParameters["DocumentIds"].ToString().Split(new string[] { "," }, StringSplitOptions.RemoveEmptyEntries);

                    foreach (var documentId in documentIdList)
                    {
                        OrganizationRequest req = new OrganizationRequest("bcgov_DownloadDocumentFromSharePoint");
                        req["Target"] = new EntityReference("bcgov_documenturl", new Guid(documentId));

                        var resp = service.Execute(req);
                        if (resp != null && resp.Results != null && resp.Results.Count > 0)
                        {
                            if (resp.Results.Contains("IsSuccess") && (bool)resp["IsSuccess"])
                            {
                                Entity attachment = new Entity("activitymimeattachment");
                                attachment["objectid"] = emailEntity.ToEntityReference();
                                attachment["objecttypecode"] = "email";
                                attachment["subject"] = resp["FileName"];
                                attachment["filename"] = resp["FileName"];
                                attachment["body"] = resp["Body"];
                                attachments.Add(attachment);
                            }
                        }
                    }

                    if (attachments.Count > 0)
                    {
                        EntityCollection entColl = new EntityCollection(attachments);
                        entColl.EntityName = "activitymimeattachment";
                        emailEntity.RelatedEntities.Add(new Relationship("email_activity_mime_attachment"), entColl);
                    }
                }

                emailId = service.Create(emailEntity).ToString();
            }
            catch (FaultException<OrganizationServiceFault> ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
                result = ex.Message;
            }
            catch (Exception ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
                result = ex.Message;
            }
            finally
            {
                if (!string.IsNullOrEmpty(result))
                    context.OutputParameters["UserMessage"] = result;

                if (!string.IsNullOrEmpty(emailId))
                    context.OutputParameters["EmailId"] = emailId;
            }
        }

        private EntityCollection GetFromActivityParty(IOrganizationService service, Guid userId)
        {
            EntityCollection result = new EntityCollection();
            result.EntityName = "activityparty";

            var userEntity = service.Retrieve("systemuser", userId, new ColumnSet("internalemailaddress"));

            Entity activityPartyEntity = new Entity("activityparty");
            activityPartyEntity["addressused"] = userEntity.Contains("internalemailaddress") ? userEntity["internalemailaddress"].ToString() : "";
            activityPartyEntity["partyid"] = new EntityReference("systemuser", userId);
            result.Entities.Add(activityPartyEntity);

            return result;
        }

        private EntityReference GetRegardingObject(IOrganizationService service, string entityName, Guid entityId)
        {
            EntityReference result = null;

            if (entityName.Equals("contact", StringComparison.InvariantCultureIgnoreCase))
            {
                result = new EntityReference(entityName, entityId);
            }
            else if (entityName.Equals("account", StringComparison.InvariantCultureIgnoreCase))
            {
                result = new EntityReference(entityName, entityId);
            }
            else if (entityName.Equals("incident", StringComparison.InvariantCultureIgnoreCase))
            {
                result = new EntityReference(entityName, entityId);
            }
            else
                throw new InvalidPluginExecutionException(string.Format("Send Email is not enabled on '{0}'..", entityName));

            return result;
        }
    }
}
