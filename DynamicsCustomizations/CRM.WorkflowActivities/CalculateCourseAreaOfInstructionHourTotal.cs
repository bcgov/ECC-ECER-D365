using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Sdk.Workflow;
using System;
using System.Activities;

namespace CRM.CustomWorkflow
{
    /// <summary>
    /// Each Course is associated to a collectoin of Area of Instructions
    /// Each Course Area of Instructions contain 2 fields
    /// Hours 
    /// New Hours
    /// New Hours is used for Change Request or Annual Program Profile Review
    /// </summary>
    public class CalculateCourseAreaOfInstructionHourTotal : CodeActivity
    {
        [Input("Course")]
        [RequiredArgument]
        [ReferenceTarget("ecer_course")]
        public InArgument<EntityReference> CourseInArgument { get; set; }

        [Output("HoursSubtotal")]
        public OutArgument<decimal> HoursSubtotalOutArgument { get; set; }

        [Output("NewHoursSubtotal")]
        public OutArgument<decimal> NewHoursSubtotalOutArgument { get; set; }

        CodeActivityContext Activity;
        ITracingService Tracing;
        IWorkflowContext Workflow;
        IOrganizationServiceFactory ServiceFactory;
        IOrganizationService Service;

        /// <summary>
        /// Main entry point.
        /// </summary>
        /// <param name="activityContext"></param>
        protected override void Execute(CodeActivityContext activityContext)
        {
            try
            {
                Activity = activityContext;
                Tracing = Activity.GetExtension<ITracingService>();
                Workflow = Activity.GetExtension<IWorkflowContext>();
                ServiceFactory = Activity.GetExtension<IOrganizationServiceFactory>();
                Service = ServiceFactory.CreateOrganizationService(Workflow.UserId);

                Tracing.Trace(
                "Entered WorkflowActivityTest.Execute(), Activity Instance Id: {0}, Workflow Instance Id: {1}",
                activityContext.ActivityInstanceId,
                activityContext.WorkflowInstanceId);

                Tracing.Trace("WorkflowActivityTest.Execute(), Correlation Id: {0}, Initiating User: {1}",
                Workflow.CorrelationId,
                Workflow.InitiatingUserId);
                var courseSubTotal = 0m;
                var courseNewSubTotal = 0m;
                var courseER = CourseInArgument.Get(activityContext);

                // Obtain all active course area of instruction record under this course
                var query = new QueryExpression("ecer_courseprovincialrequirement") { ColumnSet = new ColumnSet(true) };
                query.Criteria.AddCondition("statecode", ConditionOperator.Equal, 0); // Active
                query.Criteria.AddCondition("ecer_courseid", ConditionOperator.Equal, courseER.Id);
                var results = Service.RetrieveMultiple(query);

                foreach(var record in results.Entities)
                {
                    var newHours = 0m;
                    var hours = 0m;
                    if (record.GetAttributeValue<decimal?>("ecer_hours").HasValue)
                    {
                        hours = record.GetAttributeValue<decimal>("ecer_hours");
                    }

                    if (record.GetAttributeValue<decimal?>("ecer_newhours").HasValue && 
                        record.GetAttributeValue<decimal>("ecer_newhours") > 0)
                    {
                        newHours = record.GetAttributeValue<decimal>("ecer_newhours");
                    }
                    else
                    {
                        newHours = hours;
                    }

                    courseSubTotal += hours;
                    courseNewSubTotal += newHours;
                }

                HoursSubtotalOutArgument.Set(activityContext, courseSubTotal);
                NewHoursSubtotalOutArgument.Set(activityContext, courseNewSubTotal);
            }
            catch (InvalidPluginExecutionException) { throw; }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException($"Unexpected error. {ex.Message}", ex);
            }
        }
    }
}