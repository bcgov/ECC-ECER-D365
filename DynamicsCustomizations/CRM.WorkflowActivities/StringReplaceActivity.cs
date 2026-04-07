using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Workflow;
using System;
using System.Activities;
using System.Linq;

namespace CRM.CustomWorkflow
{
    public class StringReplaceActivity : CodeActivity
    {
        [RequiredArgument]
        [Input("String Input")]
        public InArgument<string> StringInput { get; set; }

        [RequiredArgument]
        [Input("String Pattern")]
        public InArgument<string> PatternInput { get; set; }

        [RequiredArgument]
        [Input("Replace With")]
        public InArgument<string> ReplaceWithInput { get; set; }

        [Output("String Output")]
        public OutArgument<string> StringOutput { get; set; }

        [Output("Has Changes")]
        public OutArgument<bool> HasChangesOutput { get; set; }

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

                var hasChanges = false;
                var stringInput = StringInput.Get(activityContext);
                var pattern = PatternInput.Get(activityContext);
                var replaceWith = ReplaceWithInput.Get(activityContext);
                var stringOutput = stringInput;

                hasChanges = stringInput.Contains(pattern);
                if (hasChanges)
                {
                    stringOutput = stringInput.Replace(pattern, replaceWith);
                }
                
                HasChangesOutput.Set(activityContext, hasChanges);
                StringOutput.Set(activityContext, stringOutput);
            }
            catch (InvalidPluginExecutionException) { throw; }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException($"Unexpected error. {ex.Message}", ex);
            }
        }
    }
}