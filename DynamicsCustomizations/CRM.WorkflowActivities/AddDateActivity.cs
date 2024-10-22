using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Sdk.Workflow;
using System;
using System.Activities;

namespace CRM.CustomWorkflow
{
    public class AddDateActivity : CodeActivity
    {
        [RequiredArgument]
        [Input("Date Field")]
        public InArgument<DateTime> DateInput { get; set; }

        [Input("Add year")]
        public InArgument<int> AddYearInput { get; set; }

        [Input("Add month")]
        public InArgument<int> AddMonthInput { get; set; }

        [Input("Add day")]
        public InArgument<int> AddDayInput { get; set; }

        [Output("Result Date")]
        public OutArgument<DateTime> ResultDateOutput { get; set; }



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

                var dateToProcess = DateInput.Get(activityContext);
                var yearToAdd = AddYearInput.Get(activityContext);
                var monthToAdd = AddMonthInput.Get(activityContext);
                var dayToAdd = AddDayInput.Get(activityContext);
                Tracing.Trace($"Input Date: {dateToProcess.ToLongTimeString()}");

                // Perform Date Addition
                var resultDate = dateToProcess.AddYears(yearToAdd).AddMonths(monthToAdd).AddDays(dayToAdd);
                ResultDateOutput.Set(activityContext, resultDate);
                Tracing.Trace($"Result Date: {resultDate.ToLongTimeString()}");
            }
            catch (InvalidPluginExecutionException) { throw; }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException($"Unexpected error. {ex.Message}", ex);
            }
        }
    }
}
