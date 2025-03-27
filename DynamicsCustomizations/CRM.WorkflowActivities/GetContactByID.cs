using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Sdk.Workflow;
using System;
using System.Activities;
using System.Linq;

namespace CRM.CustomWorkflow
{
    /// <summary>
    /// Get Contact Entity Reference By ID
    /// To Be Used by Custom Action when passing the PK GUID in string
    /// </summary>
    public class GetContactByID : CodeActivity
    {
        [RequiredArgument]
        [Input("Contact ID")]
        public InArgument<string> ContactIDInput { get; set; }

        [Output("Contact")]
        [ReferenceTarget("contact")]
        public OutArgument<EntityReference> ContactOutput { get; set; }

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
                EntityReference entityReference = null;
                var contactIdString = ContactIDInput.Get(activityContext);
                Guid contactId;
                if (!string.IsNullOrEmpty(contactIdString) && Guid.TryParse(contactIdString, out contactId))
                {
                    // This is stupid.  The Retrieve throws an exception if not found instead of NULL.
                    // Use Retrieve Mutliple and query by primary key instead.
                    var query = new QueryExpression("contact") { ColumnSet = new ColumnSet(false) };
                    query.Criteria.AddCondition("contactid", ConditionOperator.Equal, contactId);
                    var results = Service.RetrieveMultiple(query);
                    if (results.Entities.Count > 0) 
                    entityReference = results[0].ToEntityReference();
                }

                ContactOutput.Set(activityContext, entityReference);
                
            }
            catch (InvalidPluginExecutionException) { throw; }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException($"Unexpected error. {ex.Message}", ex);
            }
        }
    }
}
