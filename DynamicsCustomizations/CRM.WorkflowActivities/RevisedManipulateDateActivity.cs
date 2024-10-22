using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Sdk.Workflow;
using System;
using System.Activities;

namespace CRM.CustomWorkflow
{
    public class RevisedManipulateDateActivity : CodeActivity
    {
        [RequiredArgument]
        [Input("Date Field")]
        public InArgument<DateTime> DateInput { get; set; }

        [Output("Next Year")]
        public OutArgument<DateTime> NextYearDateOutput { get; set; }

        [Output("First Day of Month")]
        public OutArgument<DateTime> FirstDayOfMonthOutput { get; set; }

        [Output("Last Day of Previous Month")]
        public OutArgument<DateTime> LastDayOfPreviousMonthOutput { get; set; }

        [Output("Next Year First Day of Month")]
        public OutArgument<DateTime> NextYearFirstDayOfMonthOutput { get; set; }

        [Output("Next Year First Day of Next Month")]
        public OutArgument<DateTime> NextYearFirstDayOfNextMonthOutput { get; set; }

        [Output("Next Year Last Day of Month")]
        public OutArgument<DateTime> NextYearLastDayOfMonthOutput { get; set; }

        [Output("Next Year Last Day of Previous Month")]
        public OutArgument<DateTime> NextYearLastDayOfPreviousMonthOutput { get; set; }


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
                Tracing.Trace($"Input Date: {dateToProcess.ToLongTimeString()}");

                // Next Year of date to Process
                var nextYearDate = dateToProcess.AddYears(1);
                NextYearDateOutput.Set(activityContext, nextYearDate);
                Tracing.Trace($"Next Year of Date: {nextYearDate.ToLongTimeString()}");

                // First Day of This Month
                var firstDayOfThisMonth = dateToProcess.AddDays(-(dateToProcess.Day - 1)); // First Day of Month
                FirstDayOfMonthOutput.Set(activityContext, firstDayOfThisMonth);
                Tracing.Trace($"First Day of This Month: {firstDayOfThisMonth.ToLongTimeString()}");

                // Last Day of Previous Month
                var lastDayOfPreviousMonth = firstDayOfThisMonth.AddDays(-1);
                LastDayOfPreviousMonthOutput.Set(activityContext, lastDayOfPreviousMonth);
                Tracing.Trace($"Last Day of Previous Month: {lastDayOfPreviousMonth.ToLongTimeString()}");

                // Next Year, First Day of This Month
                var nextYearFirstDayOfThisMonth = firstDayOfThisMonth.AddYears(1);
                NextYearFirstDayOfMonthOutput.Set(activityContext, nextYearFirstDayOfThisMonth);
                Tracing.Trace($"Next Year, First Day of This Month: {nextYearFirstDayOfThisMonth.ToLongTimeString()}");

                // Next Year, First Day of Next Month
                var nextYearFirstDayOfNextMonth = nextYearFirstDayOfThisMonth.AddMonths(1);
                NextYearFirstDayOfNextMonthOutput.Set(activityContext, nextYearFirstDayOfNextMonth);
                Tracing.Trace($"Next Year, First Day of This Month: {nextYearFirstDayOfNextMonth.ToLongTimeString()}");

                // Next Year, Last Day of Month
                var nextYearLastDayOfThisMonth = nextYearFirstDayOfNextMonth.AddDays(-1);
                NextYearLastDayOfMonthOutput.Set(activityContext, nextYearLastDayOfThisMonth);
                Tracing.Trace($"Next Year, Last Day of This Month: {nextYearLastDayOfThisMonth.ToLongTimeString()}");

                // Next Year, Last Day of Previous Month
                var nextYearLastDayOfPreviousMonth = nextYearFirstDayOfThisMonth.AddDays(-1);
                NextYearLastDayOfPreviousMonthOutput.Set(activityContext, nextYearLastDayOfPreviousMonth);
                Tracing.Trace($"Next Year, Last Day of Previous Month: {nextYearLastDayOfPreviousMonth.ToLongTimeString()}");

            }
            catch (InvalidPluginExecutionException) { throw; }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException($"Unexpected error. {ex.Message}", ex);
            }
        }
    }
}
