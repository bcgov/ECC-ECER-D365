using System;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace BCGOV.Plugin.DocumentUrl
{
    public class CloneDocumentInSharePoint : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            IPluginExecutionContext context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            IOrganizationServiceFactory serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            ITracingService traceService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

            traceService.Trace("Initializing action..");

            EntityReference targetLookup = null;
            bool isSuccess = false;
            string userMessage = string.Empty;
            try
            {
                #region Validations
                if (!context.InputParameters.Contains("Target"))
                {
                    userMessage = "Target is empty..";
                    return;
                }
                if (!(context.InputParameters["Target"] is EntityReference))
                {
                    userMessage = "Target is empty..";
                    return;
                }

                targetLookup = context.InputParameters["Target"] as EntityReference;

                if (!context.InputParameters.Contains("NewCaseNumber"))
                {
                    userMessage = "NewCaseNumber is empty..";
                    return;
                }
                if (!(context.InputParameters["NewCaseNumber"] is string))
                {
                    userMessage = "NewCaseNumber is empty..";
                    return;
                }
                if (context.InputParameters["NewCaseNumber"] == null)
                {
                    userMessage = "NewCaseNumber is empty..";
                    return;
                }
                if (string.IsNullOrEmpty(context.InputParameters["NewCaseNumber"].ToString()))
                {
                    userMessage = "NewCaseNumber is empty..";
                    return;
                }

                var newCaseNumber = context.InputParameters["NewCaseNumber"].ToString();
                #endregion

                QueryExpression exp = new QueryExpression("incident");
                exp.NoLock = true;
                exp.Criteria.AddCondition("ticketnumber", ConditionOperator.Equal, newCaseNumber);

                var coll = service.RetrieveMultiple(exp);
                if (coll == null)
                {
                    userMessage = "Unable to find the new case..";
                    return;
                }
                if (coll.Entities == null)
                {
                    userMessage = "Unable to find the new case..";
                    return;
                }
                if (coll.Entities.Count < 1)
                {
                    userMessage = "Unable to find the new case..";
                    return;
                }

                var newCaseId = coll.Entities[0].Id;

                OrganizationRequest req = new OrganizationRequest("bcgov_DownloadDocumentFromSharePoint");
                req["Target"] = targetLookup;

                var resp = service.Execute(req);
                if (resp != null && resp.Results != null && resp.Results.Count > 0)
                {
                    if (resp.Results.Contains("IsSuccess") && (bool)resp["IsSuccess"])
                    {
                        req = new OrganizationRequest("bcgov_UploadDocumentToSharePoint");
                        req["FileName"] = resp["FileName"];
                        req["Body"] = resp["Body"];
                        req["RegardingObjectName"] = coll.Entities[0].LogicalName.ToLowerInvariant();
                        req["RegardingObjectId"] = coll.Entities[0].Id.ToString();
                        req["Origin"] = new OptionSetValue(931490002); //User Upload

                        resp = (OrganizationResponse)service.Execute(req);
                        if (resp.Results.Contains("IsSuccess") && (bool)resp.Results["IsSuccess"] && resp.Results.Contains("Result") && !string.IsNullOrEmpty(resp.Results["Result"].ToString()))
                        {
                            Guid sharePointUrlId = Guid.Empty;
                            if (Guid.TryParse(resp.Results["Result"].ToString(), out sharePointUrlId))
                            {
                                isSuccess = true;
                                userMessage = sharePointUrlId.ToString();
                            }
                            else
                            {
                                userMessage = resp.Results["Result"].ToString();
                            }
                        }
                        else
                        {
                            if (resp.Results.Contains("Result") && resp.Results["Result"] != null)
                                userMessage = resp.Results["Result"].ToString();
                            else
                                userMessage = "Unable to upload the document..";
                        }
                    }
                    else
                    {
                        if (resp.Results.Contains("Result") && resp.Results["Result"] != null)
                            userMessage = resp.Results["Result"].ToString();
                        else
                            userMessage = "Unable to download the document..";
                    }
                }
                else
                {
                    userMessage = "Unable to download the document..";
                    return;
                }
            }
            catch (FaultException<OrganizationServiceFault> ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
                userMessage = "An error occurred in the CloneDocument Action.." + ex.Message;
            }
            catch (Exception ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
                userMessage = "An error occurred in the CloneDocument Action.." + ex.Message;
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
