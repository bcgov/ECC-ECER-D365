using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Workflow;
using System.Activities;

namespace CRM.CustomWorkflow
{
    public class ConcatenateStringActivity : CodeActivity
    {
        [RequiredArgument]
        [Input("String A")]
        public InArgument<string> StringAInput { get; set; }

        [RequiredArgument]
        [Input("String B")]
        public InArgument<string> StringBInput { get; set; }

        [Output("Concatenated Results")]
        public OutArgument<string> ResultOuput { get; set; }

        CodeActivityContext Activity;
        ITracingService Tracing;

        /// <summary>
        /// Main entry point.
        /// </summary>
        /// <param name="activityContext"></param>
        protected override void Execute(CodeActivityContext activityContext)
        {
            Activity = activityContext;
            Tracing = Activity.GetExtension<ITracingService>();

            var stringA = StringAInput.Get(activityContext);
            var stringB = StringBInput.Get(activityContext);
            var results = string.Empty;
            Tracing.Trace($"String A: {stringA} | String B: {stringB}");
            stringA = stringA.Trim();
            stringB = stringB.Trim();
            if (string.IsNullOrWhiteSpace(stringA))
            {
                stringA = string.Empty;
            }
            if (string.IsNullOrWhiteSpace(stringB))
            {
                stringB = string.Empty;
            }
            results = stringA + stringB;

            ResultOuput.Set(activityContext, results);

        }
    }
}
