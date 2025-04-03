using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Sdk.Workflow;
using System;
using System.Activities;
using System.Linq;

namespace CRM.CustomWorkflow
{
    /// <summary>
    /// Get Contact Entity Reference By First Name, Last Name, and Client ID
    ///
    /// </summary>
    public class GetContactByRegistrationNumber : CodeActivity
    {
        [RequiredArgument]
        [Input("Registration Number")]
        public InArgument<string> ContactIDInput { get; set; }

        [Output("Contact")]
        [ReferenceTarget("contact")]
        public OutArgument<EntityReference> ContactOutput { get; set; }

        [Output("Has Results")] 
        public OutArgument<bool> HasResultOutput { get; set; }

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
                var registrationNumberString = ContactIDInput.Get(activityContext);
                int registrationNumber = 0;
                var hasResults = false;
                if (!string.IsNullOrEmpty(registrationNumberString) && int.TryParse(registrationNumberString, out registrationNumber))
                {
                    // Use Retrieve Mutliple and query by primary key instead.
                    var query = new QueryExpression("contact") { ColumnSet = new ColumnSet("ecer_clientid") };
                    query.Criteria.AddCondition("statecode", ConditionOperator.Equal, 0); // active
                    query.Criteria.AddCondition("ecer_clientid", ConditionOperator.Like, "%" + registrationNumberString + "%"); // lessen the result set by having matching client id
                    var results = Service.RetrieveMultiple(query);

                    // Further isolate result set by comparing as numeric value
                    foreach(var contact in results.Entities)
                    {
                        var contactClientIdString = contact.GetAttributeValue<string>("ecer_clientid");
                        int contactClientId = 0;
                        if (!int.TryParse(contactClientIdString, out contactClientId))
                        {
                            continue;
                        }
                        if (contactClientId == registrationNumber)
                        {
                            entityReference = contact.ToEntityReference();
                            hasResults = true;
                            break;
                        }
                    }
                }
                HasResultOutput.Set(activityContext, hasResults);
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
