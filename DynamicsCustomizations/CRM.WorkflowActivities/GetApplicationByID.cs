﻿using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Sdk.Workflow;
using System;
using System.Activities;
using System.Linq;

namespace CRM.CustomWorkflow
{
    /// <summary>
    /// Get Application Entity Reference By ID
    /// To Be Used by Custom Action when passing the PK GUID in string
    /// </summary>
    public class GetApplicationByID : CodeActivity
    {
        [RequiredArgument]
        [Input("Application ID")]
        public InArgument<string> ApplicationIDInput { get; set; }

        [Output("Application")]
        [ReferenceTarget("ecer_application")]
        public OutArgument<EntityReference> ApplicationOutput { get; set; }

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
                var applicationIdString = ApplicationIDInput.Get(activityContext);
                Guid applicationId;
                if (!string.IsNullOrEmpty(applicationIdString) && Guid.TryParse(applicationIdString, out applicationId))
                {
                    // This is stupid.  The Retrieve throws an exception if not found instead of NULL.
                    // Use Retrieve Mutliple and query by primary key instead.
                    var query = new QueryExpression("ecer_application") { ColumnSet = new ColumnSet(false) };
                    query.Criteria.AddCondition("ecer_applicationid", ConditionOperator.Equal, applicationId);
                    var results = Service.RetrieveMultiple(query);
                    if (results.Entities.Count > 0)
                        entityReference = results[0].ToEntityReference();
                }

                ApplicationOutput.Set(activityContext, entityReference);
                
            }
            catch (InvalidPluginExecutionException) { throw; }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException($"Unexpected error. {ex.Message}", ex);
            }
        }
    }
}
