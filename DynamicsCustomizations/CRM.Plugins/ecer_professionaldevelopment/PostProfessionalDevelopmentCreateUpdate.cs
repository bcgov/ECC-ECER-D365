using CRM.Plugins.Enums;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System;
using System.Linq;
using static System.Net.Mime.MediaTypeNames;

namespace CRM.Plugins.ecer_professionaldevelopment
{
    public class PostProfessionalDevelopmentCreateUpdate : PluginBase
    {
        public ITracingService tracingService;

        public PostProfessionalDevelopmentCreateUpdate(Type pluginClassName) : base(pluginClassName)
        {

        }

        protected override void ExecuteDataversePlugin(ILocalPluginContext localPluginContext)
        {
            // This plugin is executed after the course entity is created or updated.

            IPluginExecutionContext context = localPluginContext.PluginExecutionContext;
            // Using the admin service to ensure that the plugin can run in all context
            IOrganizationService service = localPluginContext.OrganizationServiceAdmin;
            tracingService = localPluginContext.TracingService;

            tracingService.Trace("PostProfessionalDevelopmentCreateUpdate plugin started.");

            Entity target = context.InputParameters["Target"] as Entity;

            // When delete
            if (target == null)
            {
                EntityReference targetReference = context.InputParameters["Target"] as EntityReference;
                target = new Entity(targetReference.LogicalName, targetReference.Id);
            }


            if (target == null)
            {
                tracingService.Trace("Target entity is null.");
                return;
            }

            if (target.LogicalName.ToLower() != "ecer_professionaldevelopment")
            {
                tracingService.Trace("Target entity is not a course.");
                return;
            }

            EntityReference application = null;

            if (context.MessageName.ToLower() == "create")
            {
                application = target.GetAttributeValue<EntityReference>("ecer_applicationid");
            }
            else if (context.MessageName.ToLower() == "update")
            {
                Entity entityImage = context.PostEntityImages.ContainsKey("PostImage") ? context.PostEntityImages["PostImage"] as Entity : null;
                application = entityImage?.GetAttributeValue<EntityReference>("ecer_applicationid");
                // Should fire on update of anticipated hours / statuscode
            }
            else if (context.MessageName.ToLower() == "delete")
            {
                Entity entityImage = context.PostEntityImages.ContainsKey("PreImage") ? context.PostEntityImages["PreImage"] as Entity : null;
                application = entityImage?.GetAttributeValue<EntityReference>("ecer_applicationid");
            }

            if (application == null)
            {
                tracingService.Trace("Application is null.");
                return;
            }

            decimal totalAnticipatedHours = CalculateTotalAnticipatedHours(application, service);

            tracingService.Trace($"Calculated Total Anticipated Hours {totalAnticipatedHours}");

            Entity applicationUpdated = new Entity(application.LogicalName, application.Id);
            applicationUpdated["ecer_totalanticipatedprofessionaldevelopmenthours"] = totalAnticipatedHours;

            service.Update(applicationUpdated);
        }


        /// <summary>
        /// Calculates the total anticipated hours for the application.
        /// Aggregate query filters uses statuscode
        /// </summary>
        private decimal CalculateTotalAnticipatedHours(EntityReference application, IOrganizationService service)
        {
            if (application == null)
            {
                return 0;
            }

            tracingService.Trace($"Calculating rollups for application {application.Id}");


            string fetchXml = $@"
                          <fetch aggregate='true'>
                              <entity name='ecer_professionaldevelopment'>
                                <attribute name='ecer_totalanticipatedhours' alias='TotalAnticipatedHours' aggregate='sum' />
                                <attribute name='ecer_applicationid' alias='ApplicationId' groupby='true' />
                                <filter>
                                  <condition attribute='ecer_applicationid' operator='eq' value='{application.Id}' />
                                  <condition attribute='statuscode' operator='ne' value='2' />
                                  <condition attribute='statuscode' operator='ne' value='621870005' />
                                  <condition attribute='ecer_totalanticipatedhours' operator='ge' value='0' />
                                </filter>
                              </entity>
                            </fetch>";

            EntityCollection result = service.RetrieveMultiple(new FetchExpression(fetchXml));

            return result.Entities.FirstOrDefault()?.GetAttributeValue<AliasedValue>("TotalAnticipatedHours")?.Value as decimal? ?? 0;
        }
    }
}
