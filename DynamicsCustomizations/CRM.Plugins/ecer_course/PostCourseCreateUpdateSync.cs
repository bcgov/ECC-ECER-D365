using CRM.Plugins.Enums;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CRM.Plugins.ecer_course
{
    public class PostCourseCreateUpdateSync : PluginBase
    {
        public PostCourseCreateUpdateSync(string unsecure, string secure) : base(typeof(PostCourseCreateUpdateSync))
        {
        }

        public ITracingService tracingService;


        protected override void ExecuteDataversePlugin(ILocalPluginContext localPluginContext)
        {
            // This plugin is executed after the course entity is created or updated.

            IPluginExecutionContext context = localPluginContext.PluginExecutionContext;
            // Using the admin service to ensure that the plugin can run in all context
            IOrganizationService service = localPluginContext.OrganizationServiceAdmin;
            tracingService = localPluginContext.TracingService;

            tracingService.Trace("PostCourseCreateUpdateSync plugin started.");

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

            if (target.LogicalName.ToLower() != "ecer_course")
            {
                tracingService.Trace("Target entity is not a course.");
                return;
            }

            OptionSetValue programType = target.GetAttributeValue<OptionSetValue>("ecer_programtype");
            decimal? courseHours = target.GetAttributeValue<decimal?>("ecer_coursehourdecimal");
            EntityReference postSecondaryInstitutionId = target.GetAttributeValue<EntityReference>("ecer_postsecondaryinstitutionid");
            EntityReference programId = target.GetAttributeValue<EntityReference>("ecer_programid");

            // one of the fields updated, get it from post image in update
            // pre-image in delete
            Entity entityImage = GetEntityInformation(context.MessageName, context.PreEntityImages, context.PostEntityImages);

            programType = programType ?? entityImage?.GetAttributeValue<OptionSetValue>("ecer_programtype");
            courseHours = courseHours ?? entityImage?.GetAttributeValue<decimal?>("ecer_coursehourdecimal");
            postSecondaryInstitutionId = postSecondaryInstitutionId ?? entityImage?.GetAttributeValue<EntityReference>("ecer_postsecondaryinstitutionid");
            programId = programId ?? entityImage?.GetAttributeValue<EntityReference>("ecer_programid");

            if (programType == null
                || courseHours == null
                || postSecondaryInstitutionId == null
                || programId == null)
            {
                tracingService.Trace("Program type or course hours or post secondary institution or program is null.");
                return;
            }

            CalculateRollupsForCourseHours(service, programType.Value, postSecondaryInstitutionId, programId);
        }

        private Entity GetEntityInformation(string messageName, EntityImageCollection preImageCollection, EntityImageCollection postImageCollection)
        {
            Entity entityImage = null;
            if (messageName.ToLower() == "update")
            {
                entityImage = postImageCollection["PostImage"] as Entity;
            }
            else if (messageName.ToLower() == "delete")
            {
                entityImage = preImageCollection["PreImage"] as Entity;
            }

            if (entityImage == null)
            {
                tracingService.Trace($"Image not configured for PostCourseCreateUpdateSync, message:{messageName}");
            }

            return entityImage;
        }

        /// <summary>
        /// Calculates the rollups for course hours for active records only
        /// </summary>
        private void CalculateRollupsForCourseHours(IOrganizationService service, int programType, EntityReference postSecondaryInstitutionId, EntityReference programId)
        {
            tracingService.Trace($"Calculating rollups for course hours for PSI {postSecondaryInstitutionId.Id} for program {programId.Id} for program type {programType}");

            string fetchXml = $@"
                <fetch mapping='logical' aggregate='true'>
                    <entity name='ecer_course'>
                        <attribute name='ecer_coursehourdecimal' alias='coursehours' aggregate='sum' />
                        <attribute name='ecer_programtype' alias='programType' groupby='true' />
                        <filter>
                            <condition attribute='ecer_postsecondaryinstitutionid' operator='eq' value='{postSecondaryInstitutionId.Id}' />
                            <condition attribute='ecer_programid' operator='eq' value='{programId.Id}' />
                            <condition attribute='statecode' operator='eq' value='0' />
                            <condition attribute='statuscode' operator='eq' value='1' />
                        </filter>
                    </entity>
                </fetch>";

            EntityCollection result = service.RetrieveMultiple(new FetchExpression(fetchXml));

            tracingService.Trace("Executed aggregate query");

            Entity updateProgram = new Entity("ecer_program", programId.Id);

            // reset values
            updateProgram["ecer_basicearlychildhoodeducatorcoursestotalhours"] = 0.0;
            updateProgram["ecer_itecoursestotalhours"] = 0.0;
            updateProgram["ecer_snecoursestotalhoursdecimal"] = 0.0;


            foreach (Entity course in result.Entities)
            {
                decimal totalCourseHours = course.GetAttributeValue<AliasedValue>("coursehours").Value != null ? (decimal)(course.GetAttributeValue<AliasedValue>("coursehours").Value) : 0;

                tracingService.Trace($"Total course hours: {totalCourseHours}");

                OptionSetValue programTypeValue = course.GetAttributeValue<AliasedValue>("programType")?.Value as OptionSetValue;

                if (programTypeValue?.Value == ProgramType.Basic.GetHashCode())
                {
                    updateProgram["ecer_basicearlychildhoodeducatorcoursestotalhours"] = totalCourseHours;
                }
                else if (programTypeValue?.Value == ProgramType.ITE.GetHashCode())
                {
                    updateProgram["ecer_itecoursestotalhours"] = totalCourseHours;
                }
                else if (programTypeValue?.Value == ProgramType.SNE.GetHashCode())
                {
                    updateProgram["ecer_snecoursestotalhoursdecimal"] = totalCourseHours;
                }

                tracingService.Trace($"Updating Program with {totalCourseHours} hours for program type {programTypeValue?.Value}");
            }

            service.Update(updateProgram);
            tracingService.Trace("Completed CalculateRollupsForCourseHours");
        }
    }
}
