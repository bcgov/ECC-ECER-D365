using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Sdk.Workflow;
using System;
using System.Activities;

namespace CRM.CustomWorkflow
{
    public class DateDifferenceActivity : CodeActivity
    {
        [Input("Date A")]
        public InArgument<DateTime> DateAInArgument { get; set; }

        [Input("Date B")]
        public InArgument<DateTime> DateBInArgument { get; set; }

        [Output("Different In Days")]
        public OutArgument<decimal> DifferentInDaysOutput { get; set; }

        [Output("Different In Years")]
        public OutArgument<decimal> DifferentInYearsOutput { get; set; }

        [Output("Date A is Earlier")]
        public OutArgument<bool> IsDateAEarlierOutput { get; set; }

        [Output("Has Both Dates")]
        public OutArgument<bool> HasBothDatesOutput { get; set; }

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
                Tracing.Trace($"{CustomCodeHelper.LineNumber()}: ");
                var hasBothDates = DateAInArgument != null && DateBInArgument != null;
                var today = DateTime.Today;
                var dateA = today;
                var dateB = today;
                Tracing.Trace($"{CustomCodeHelper.LineNumber()}: date A: {dateA.ToShortDateString()} | date B: {dateB.ToShortDateString()}");
                if (DateAInArgument != null)
                    dateA = DateAInArgument.Get(activityContext);
                if (DateBInArgument != null)
                    dateB = DateBInArgument.Get(activityContext);
                Tracing.Trace($"{CustomCodeHelper.LineNumber()}: date A: {dateA.ToShortDateString()} | date B: {dateB.ToShortDateString()}");
                var differentInDays = 0m;
                var differentInYears = 0m;
                var isDateAEarlier = false;
                Tracing.Trace($"{CustomCodeHelper.LineNumber()}: Has Both Dates: {hasBothDates.ToString()}");

                if (hasBothDates)
                {
                    var dateDifference = (decimal)((dateA - dateB).TotalDays);
                    isDateAEarlier = (dateDifference < 0);
                    differentInDays = Math.Abs(dateDifference);
                    differentInYears = differentInDays / 365.25m;
                }
                Tracing.Trace($"{CustomCodeHelper.LineNumber()}: Has Both Dates: {hasBothDates.ToString()} | is Date A Earlier: {isDateAEarlier} | Date Difference in Days: {differentInDays} | in years: {differentInYears}");
                IsDateAEarlierOutput.Set(activityContext, isDateAEarlier);
                DifferentInDaysOutput.Set(activityContext, differentInDays);
                DifferentInYearsOutput.Set(activityContext, differentInYears);
                HasBothDatesOutput.Set(activityContext, hasBothDates);
            }
            catch (InvalidPluginExecutionException) { throw; }
            catch (Exception ex)
            {
                Tracing.Trace($"Error: {ex.Message}");
                throw new InvalidPluginExecutionException($"Unexpected error. {ex.Message}", ex);
            }
        }
    }
}
