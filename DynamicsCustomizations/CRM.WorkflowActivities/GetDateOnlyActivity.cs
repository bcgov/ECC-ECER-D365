using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Sdk.Workflow;
using System.Activities;
using System;

namespace CRM.CustomWorkflow
{
    public class GetDateOnlyActivity : CodeActivity
    {
        [RequiredArgument]
        [Input("Date Field")]
        public InArgument<DateTime> DateInput { get; set; }

        [Output("Result Date")]
        public OutArgument<DateTime> ResultDateOutput { get; set; }

        [Output("Result Date UTC")]
        public OutArgument<DateTime> ResultDateUTCOutput { get; set; }


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
                Tracing.Trace($"Input Date: {dateToProcess.ToString("MMMM/d/yyyy hh:mm:ss")}");

                dateToProcess = ConvertToPacificTime(dateToProcess);
                // Perform Date Addition
                var resultDate = new DateTime(dateToProcess.Year, dateToProcess.Month, dateToProcess.Day);
                ResultDateOutput.Set(activityContext, resultDate);
                ResultDateUTCOutput.Set(activityContext, resultDate.ToUniversalTime());
                Tracing.Trace($"Result Date: {resultDate.ToString("MMMM/d/yyyy hh:mm:ss")}");
                Tracing.Trace($"Result Date UTC: {resultDate.ToUniversalTime().ToString("MMMM/d/yyyy hh:mm:ss")}");
            }
            catch (InvalidPluginExecutionException) { throw; }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException($"Unexpected error. {ex.Message}", ex);
            }
        }
        public DateTime ConvertToPacificTime(DateTime utc)
        {
            //var isDayLightSaving = utc.IsDaylightSavingTime();
            TimeZoneInfo pacificZone = TimeZoneInfo.FindSystemTimeZoneById("Pacific Standard Time");
            var pacificTime = TimeZoneInfo.ConvertTimeFromUtc(utc, pacificZone);
            return pacificTime;
        }
    }
}
