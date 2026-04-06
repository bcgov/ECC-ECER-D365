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
    public class GetConfigValueByGroupAndKey : CodeActivity
    {
        [RequiredArgument]
        [Input("Group")]
        public InArgument<string> GroupInput { get; set; }

        [RequiredArgument]
        [Input("Key")]
        public InArgument<string> KeyInput { get; set; }

        [Output("Value")]
        public OutArgument<string> ValueOutput { get; set; }

        [Output("Secure Value")]
        public OutArgument<string> SecureValueOutput { get; set; }

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
                var value = string.Empty;
                var secureValue = string.Empty;
                var hasResults = false;

                // This is stupid.  The Retrieve throws an exception if not found instead of NULL.
                // Use Retrieve Mutliple and query by primary key instead.
                var query = new QueryExpression("bcgov_config") { ColumnSet = new ColumnSet(true) };
                query.Criteria.AddCondition("bcgov_group", ConditionOperator.Equal, groupString);
                query.Criteria.AddCondition("bcgov_key", ConditionOperator.Equal, keyString);
                var results = Service.RetrieveMultiple(query);
                if (results.Entities.Count > 0)
                {
                    hasResults = true;
                    value = results[0].GetAttributeValue<string>("bcgov_value");
                    secureValue = results[0].GetAttributeValue<string>("bcgov_securevalue");
                }

                ValueOutput.Set(activityContext, value);
                SecureValueOutput.Set(activityContext, secureValue);
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
