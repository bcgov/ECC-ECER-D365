using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Sdk.Workflow;
using System.Activities;
using System;

namespace CRM.CustomWorkflow
{
    public class GetDatePartAndNameActivity : CodeActivity
    {
        [RequiredArgument]
        [Input("Date to Evaluate")]
        public InArgument<DateTime> DateInput { get; set; }

        [Output("Year In 4 digits")]
        public OutArgument<int> OutYearIn4Digits { get; set; }

        [Output("Year In 4 digits text")]
        public OutArgument<string> OutYearIn4DigitsText { get; set; }

        [Output("Year In 2 digits")]
        public OutArgument<int> OutYearIn2Digits { get; set; }

        [Output("Day")]
        public OutArgument<int> OutDay { get; set; }

        [Output("Day In 2 digits")]
        public OutArgument<string> OutDayIn2Digits { get; set; }

        [Output("Month in numbers")]
        public OutArgument<int> OutMonthInNumbers { get; set; }

        [Output("Month in 2 digits")]
        public OutArgument<string> OutMonthIn2Digit { get; set; }

        [Output("Month in full")]
        public OutArgument<string> OutMonthInFull { get; set; }

        [Output("Month Abbreviation")]
        public OutArgument<string> OutMonthInAbbreviation { get; set; }

        [Output("Long Date String")]
        public OutArgument<string> OutLongDateString { get; set; }

        [Output("US Short Date String")]
        public OutArgument<string> OutUSShortDateString { get; set; }

        [Output("Cdn Short Date String")]
        public OutArgument<string> OutCdnShortDateString { get; set; }

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
            Activity = activityContext;
            Tracing = Activity.GetExtension<ITracingService>();
            Workflow = Activity.GetExtension<IWorkflowContext>();
            ServiceFactory = Activity.GetExtension<IOrganizationServiceFactory>();
            Service = ServiceFactory.CreateOrganizationService(Workflow.UserId);

            var enteredDate = DateInput.Get(activityContext);

            // date parts
            if (enteredDate != null && enteredDate != DateTime.MinValue)
            {
                OutYearIn4Digits.Set(activityContext, enteredDate.Year);
                OutYearIn4DigitsText.Set(activityContext, enteredDate.ToString("yyyy"));
                OutYearIn2Digits.Set(activityContext, (enteredDate.Year % 100));
                OutDay.Set(activityContext, enteredDate.Day);
                OutDayIn2Digits.Set(activityContext, enteredDate.ToString("dd"));
                OutMonthInNumbers.Set(activityContext, enteredDate.Month);
                OutMonthIn2Digit.Set(activityContext, enteredDate.ToString("MM"));
                OutMonthInFull.Set(activityContext, enteredDate.ToString("MMMM"));
                OutMonthInAbbreviation.Set(activityContext, enteredDate.ToString("MMM"));
                OutLongDateString.Set(activityContext, enteredDate.ToString("MMMM d, yyyy"));
                OutUSShortDateString.Set(activityContext, enteredDate.ToString("M/d/yyyy"));
                OutCdnShortDateString.Set(activityContext, enteredDate.ToString("d/M/yyyy"));
            }
            else
            {
                OutYearIn4Digits.Set(activityContext, -1);
                OutYearIn4DigitsText.Set(activityContext, string.Empty);
                OutYearIn2Digits.Set(activityContext, -1);
                OutDay.Set(activityContext, -1);
                OutDayIn2Digits.Set(activityContext, string.Empty);
                OutMonthInNumbers.Set(activityContext, -1);
                OutMonthIn2Digit.Set(activityContext, string.Empty);
                OutMonthInFull.Set(activityContext, string.Empty);
                OutMonthInAbbreviation.Set(activityContext, string.Empty);
                OutLongDateString.Set(activityContext, string.Empty);
                OutUSShortDateString.Set(activityContext, string.Empty);
                OutCdnShortDateString.Set(activityContext, string.Empty);
            }
        }
    }
}
