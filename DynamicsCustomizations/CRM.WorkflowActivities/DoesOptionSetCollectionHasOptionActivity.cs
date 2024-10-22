using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Workflow;
using System;
using System.Activities;
using System.Linq;

namespace CRM.CustomWorkflow
{
    public class DoesOptionSetCollectionHasOptionActivity : CodeActivity
    {
        [RequiredArgument]
        [Input("OptionSet Collection Field Schema Name")]
        public InArgument<string> CompareSchemaNameInput { get; set; }

        [RequiredArgument]
        [Input("Specified Option Value")]
        public InArgument<int> SpecifiedValueInput { get; set; }

        [Output("Has Changes")]
        public OutArgument<bool> HasOptionOutput { get; set; }

        CodeActivityContext Activity;
        ITracingService Tracing;
        IWorkflowContext Workflow;
        IOrganizationServiceFactory ServiceFactory;
        IOrganizationService Service;

        /// <summary>
        /// Current snapshot of Licence Application (adoxio_application).
        /// </summary>
        Entity Target;
        /// <summary>
        /// Previous snapshot of Licence Application (adoxio_application).
        /// </summary>
        Entity TargetPreImage;

        /// <summary>
        /// Current value of the specified optionset attribute.
        /// </summary>
        OptionSetValueCollection NewValue;

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

                
                var schemaName = CompareSchemaNameInput.Get(activityContext);
                var specifiedValue = SpecifiedValueInput.Get(activityContext);
                var hasMatch = false;
                Tracing.Trace($"Compare Schema Name: {schemaName}");
                var record = Service.Retrieve(Workflow.PrimaryEntityName, Workflow.PrimaryEntityId, new Microsoft.Xrm.Sdk.Query.ColumnSet(schemaName));
                NewValue = record.GetAttributeValue<OptionSetValueCollection>(schemaName);
                foreach(var optionValue in NewValue)
                {
                    if (optionValue.Value == specifiedValue)
                    {
                        hasMatch = true;
                        break;
                    }
                }

                HasOptionOutput.Set(activityContext, hasMatch);

            }
            catch (InvalidPluginExecutionException) { throw; }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException($"Unexpected error. {ex.Message}", ex);
            }
        }

        protected void Initialize()
        {
            Tracing.Trace($"PrimaryEntityName = {Workflow.PrimaryEntityName}");//Add Licence Application Sub Steps
            Tracing.Trace($"PrimaryEntityId = {Workflow.PrimaryEntityId}");//Add Licence Application Sub Steps
            Tracing.Trace($"MessageName = {Workflow.MessageName}");//Add Licence Application Sub Steps

            switch (Workflow.MessageName)
            {
                case "Create":
                    break;
                case "Update":
                    TargetPreImage = Workflow.PreEntityImages?.Values.FirstOrDefault(x => x.LogicalName == Workflow.PrimaryEntityName && x.Id == Workflow.PrimaryEntityId);
                    Tracing.Trace($"PreEntityImage => {TargetPreImage?.LogicalName} {TargetPreImage?.Id}");
                    break;
                case "ExecuteWorkflow":
                    // On Demand;
                    Tracing.Trace($"{CustomCodeHelper.LineNumber()}: On Demand Workflow, Obtain the Target entity since the target may not have all attributes");
                    Target = Service.Retrieve(Workflow.PrimaryEntityName, Workflow.PrimaryEntityId, new Microsoft.Xrm.Sdk.Query.ColumnSet(true));
                    break;
                default:
                    throw new InvalidOperationException($"This activity does not support the {Workflow.MessageName} message.");
            }

            if (Target == null && Workflow.InputParameters.Contains("Target"))
            {
                Tracing.Trace($"{CustomCodeHelper.LineNumber()}: Get Target if Create/Update");
                Target = (Entity)Workflow.InputParameters["Target"];
            }
            Tracing.Trace($"Target.LogicalName = {Target.LogicalName}");
            Tracing.Trace($"Target.Id = {Target.Id}");
        }
    }
}