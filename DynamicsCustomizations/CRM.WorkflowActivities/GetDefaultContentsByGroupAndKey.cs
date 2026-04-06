using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Sdk.Workflow;
using System;
using System.Activities;
using System.Linq;

namespace CRM.CustomWorkflow
{
    /// <summary>
    /// Get System Configuration (bcgov_config) 
    /// Fields
    ///  - bcgov_value
    ///  - bcgov_securevalue
    /// By Group (bcgov_group) and Key (bcgov_key)
    /// </summary>
    public class GetDefaultContentsByGroupAndKey : CodeActivity
    {
        [RequiredArgument]
        [Input("Group")]
        public InArgument<string> GroupInput { get; set; }

        [RequiredArgument]
        [Input("Key")]
        public InArgument<string> KeyInput { get; set; }

        [Output("Single Line of Text Value")]
        public OutArgument<string> SingleLineOfTextValueOutput { get; set; }

        [Output("Multiple Line of Text Value")]
        public OutArgument<string> MultipleLineOfTextValueOutput { get; set; }

        [Output("Has Results")]
        public OutArgument<bool> HasResultsOutput { get; set; }

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
                var groupString = GroupInput.Get(activityContext);
                var keyString = KeyInput.Get(activityContext);
                var singleLineOfText = string.Empty;
                var multipleLineOfText = string.Empty;
                var hasResults = false;

                // This is stupid.  The Retrieve throws an exception if not found instead of NULL.
                // Use Retrieve Mutliple and query by primary key instead.
                var query = new QueryExpression("ecer_defaultcontents") { ColumnSet = new ColumnSet(true) };
                query.Criteria.AddCondition("ecer_group", ConditionOperator.Equal, groupString);
                query.Criteria.AddCondition("ecer_name", ConditionOperator.Equal, keyString);
                var results = Service.RetrieveMultiple(query);
                if (results.Entities.Count > 0)
                {
                    hasResults = true;
                    singleLineOfText = results[0].GetAttributeValue<string>("ecer_singlelineoftext");
                    multipleLineOfText = results[0].GetAttributeValue<string>("ecer_multiplelineoftext");
                }

                SingleLineOfTextValueOutput.Set(activityContext, singleLineOfText);
                MultipleLineOfTextValueOutput.Set(activityContext, multipleLineOfText);
                HasResultsOutput.Set(activityContext, hasResults);

            }
            catch (InvalidPluginExecutionException) { throw; }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException($"Unexpected error. {ex.Message}", ex);
            }
        }
    }
}
