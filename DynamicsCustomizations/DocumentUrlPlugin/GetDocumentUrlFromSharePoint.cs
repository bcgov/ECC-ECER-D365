using System;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;

namespace BCGOV.Plugin.DocumentUrl
{
    public class GetDocumentUrlFromSharePoint : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            IPluginExecutionContext context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            IOrganizationServiceFactory serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            ITracingService traceService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

            traceService.Trace("Initializing action..");

            string userMessage = string.Empty;
            bool isSuccess = false;
            try
            {
                if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is EntityReference)
                {
                    EntityReference target = context.InputParameters["Target"] as EntityReference;

                    var configs = Helpers.GetSystemConfigurations(service, "Storage", string.Empty);

                    string url = Helpers.GetConfigKeyValue(configs, "StorageUrl", "Storage");

                    userMessage = url + target.Id.ToString();

                    isSuccess = true;
                }
                else
                    userMessage = "Target is not a Document Url..";
            }
            catch (FaultException<OrganizationServiceFault> ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
                userMessage = "An error occurred in the GetDocumentUrl Action.." + ex.Message;
            }
            catch (Exception ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
                userMessage = "An error occurred in the GetDocumentUrl Action.." + ex.Message;
            }
            finally
            {
                context.OutputParameters["IsSuccess"] = isSuccess;

                if (!string.IsNullOrEmpty(userMessage))
                    context.OutputParameters["FileUrl"] = userMessage;
            }
        }
    }
}
