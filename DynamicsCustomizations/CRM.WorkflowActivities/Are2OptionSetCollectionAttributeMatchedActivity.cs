using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Workflow;
using System;
using System.Activities;
using System.Linq;

namespace CRM.CustomWorkflow
{
    public class Are2OptionSetCollectionAttributeMatchedActivity : CodeActivity
    {
        [RequiredArgument]
        [Input("OptionSet A Field Schema Name")]
        public InArgument<string> CompareSchemaNameAInput { get; set; }

        [RequiredArgument]
        [Input("OptionSet B Field Schema Name")]
        public InArgument<string> CompareSchemaNameBInput { get; set; }

        [Output("Is Match")]
        public OutArgument<bool> IsMatchOutput { get; set; }

        [Output("OptionSet A Contains Data")]
        public OutArgument<bool> OptionSetAContainsDataOutput { get; set; }

        [Output("OptionSet B Contains Data")]
        public OutArgument<bool> OptionSetBContainsDataOutput { get; set; }

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
        /// Previous value of the specified optionset attribute.
        /// </summary>
        OptionSetValueCollection AttributeAValue;
        /// <summary>
        /// Current value of the specified optionset attribute.
        /// </summary>
        OptionSetValueCollection AttributeBValue;

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

                Initialize();

                var schemaNameA = CompareSchemaNameAInput.Get(activityContext);
                var schemaNameB = CompareSchemaNameBInput.Get(activityContext);

                Tracing.Trace($"Compare Schema Name A: {schemaNameA}");
                Tracing.Trace($"Compare Schema Name B: {schemaNameB}");
                var existingRecord = Service.Retrieve(Workflow.PrimaryEntityName, Workflow.PrimaryEntityId, new Microsoft.Xrm.Sdk.Query.ColumnSet(true));

                AttributeAValue = Target.GetAttributeValue<OptionSetValueCollection>(schemaNameA);
                AttributeBValue = Target.GetAttributeValue<OptionSetValueCollection>(schemaNameB);

                var attributeAContainsData = Target.Attributes.Contains(schemaNameA);
                Tracing.Trace($"Target Has attribute A in it: {attributeAContainsData}");
                if (!attributeAContainsData)
                {
                    AttributeAValue = existingRecord.GetAttributeValue<OptionSetValueCollection>(schemaNameA);
                }

                var attributeBContainsData = Target.Attributes.Contains(schemaNameB);
                Tracing.Trace($"Target Has attribute B in it: {attributeBContainsData}");
                if (!attributeBContainsData)
                {
                    AttributeBValue = existingRecord.GetAttributeValue<OptionSetValueCollection>(schemaNameB);
                }

                Tracing.Trace($"Attribute A contains data: {AttributeAValue != null}");
                Tracing.Trace($"Attribute B contains data: {AttributeBValue != null}");
                if (AttributeAValue != null)
                {
                    Tracing.Trace($"Attribute A value Count: {AttributeAValue.Count}");
                    foreach(var optionValue in AttributeAValue)
                    {
                        Tracing.Trace($"* {optionValue.Value}");
                    }
                }

                if (AttributeBValue != null)
                {
                    Tracing.Trace($"Attribute B value Count: {AttributeBValue.Count}");
                    foreach (var optionValue in AttributeBValue)
                    {
                        Tracing.Trace($"* {optionValue.Value}");
                    }
                }
                OptionSetAContainsDataOutput.Set(activityContext, AttributeAValue != null);
                OptionSetBContainsDataOutput.Set(activityContext, AttributeBValue != null);

                var bothValuesAreNULL = (AttributeAValue == null && AttributeBValue == null);
                Tracing.Trace($"Both optionset are NULL: {bothValuesAreNULL}");

                var valuesAreEqual = AttributeAValue != null && AttributeBValue != null; ;
                if (valuesAreEqual)
                {
                    valuesAreEqual = AttributeAValue.Count == AttributeBValue.Count; // Compare the array count

                    foreach (var oldOptionValue in AttributeAValue)
                    {
                        if (valuesAreEqual) // Take Early Exit if there is mismatch is found
                        {
                            var sourceValue = oldOptionValue.Value;
                            var hasMatch = false;
                            foreach (var newOptionValue in AttributeBValue)
                            {
                                var compareValue = newOptionValue.Value;
                                if (sourceValue == compareValue)
                                {
                                    hasMatch = true;
                                    break;
                                }
                            }
                            if (!hasMatch)
                            {
                                valuesAreEqual = false;
                            }
                        }
                    }

                    Tracing.Trace($"Both Values are same: {valuesAreEqual}");
                }
                var matched = (bothValuesAreNULL || valuesAreEqual);

                Tracing.Trace($"Value matched: {matched}");

                IsMatchOutput.Set(activityContext, matched);

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