using System;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System.Net.Http;

namespace BCGOV.Plugin.DocumentUrl
{
    public class MoveDocumentInSharePoint : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            IPluginExecutionContext context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            IOrganizationServiceFactory serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            ITracingService traceService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

            traceService.Trace("Initializing action..");

            HttpClient httpClient = null;
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
                if(coll == null)
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

                //call overwrite API endpoint

                Entity updateDocument = new Entity(targetLookup.LogicalName);
                updateDocument.Id = targetLookup.Id;
                updateDocument["bcgov_caseid"] = coll.Entities[0].ToEntityReference();
                service.Update(updateDocument);

                isSuccess = true;
                userMessage = targetLookup.Id.ToString();
            }
            catch (FaultException<OrganizationServiceFault> ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
                userMessage = "An error occurred in the MoveDocument Action.." + ex.Message;
            }
            catch (Exception ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
                userMessage = "An error occurred in the MoveDocument Action.." + ex.Message;
            }
            finally
            {
                if (httpClient != null)
                    httpClient.Dispose();

                context.OutputParameters["IsSuccess"] = isSuccess;

                if (!string.IsNullOrEmpty(userMessage))
                    context.OutputParameters["Result"] = userMessage;
            }
        }
    }
}
