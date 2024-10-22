using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Workflow;
using System;
using System.Activities;
using System.Linq;

namespace CRM.CustomWorkflow
{
    public class RevisedSetOptionSetCollectionFieldActivity : CodeActivity
    {
        [RequiredArgument]
        [Input("OptionSet Collection Field Schema Name")]
        public InArgument<string> FieldSchemaNameInput { get; set; }

        [RequiredArgument]
        [Input("Comma Delimited Options Value")]
        public InArgument<string> OptionsValueInput { get; set; }

        [Input("Append Existing Values")]
        public InArgument<bool> AppendValueInput { get; set; }

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

                var schemaName = FieldSchemaNameInput.Get(activityContext);
                var optionsInString = OptionsValueInput.Get(activityContext);
                var appendValue = AppendValueInput.Get(activityContext);

                // To keep this generic, get Entity information from calling workflow
                var entityLogicalName = Workflow.PrimaryEntityName;
                var recordId = Workflow.PrimaryEntityId;

                Tracing.Trace($"Compare Schema Name: {schemaName}");
                OptionSetValueCollection optionSetValueCollection = null;
                if (appendValue)
                {
                    var entityRead = Service.Retrieve(Workflow.PrimaryEntityName, Workflow.PrimaryEntityId, new Microsoft.Xrm.Sdk.Query.ColumnSet(schemaName));
                    optionSetValueCollection = entityRead.GetAttributeValue<OptionSetValueCollection>(schemaName);
                }

                if (optionSetValueCollection == null)
                {
                    optionSetValueCollection = new OptionSetValueCollection();
                }

                var optionsInArray = optionsInString.Split(',');
                var optionValue = 0;
                var entity = Service.Retrieve(entityLogicalName, recordId, new Microsoft.Xrm.Sdk.Query.ColumnSet(false));
                foreach (var option in optionsInArray)
                {
                    if (!int.TryParse(option, out optionValue))
                    {
                        continue;
                    }

                    var optionSetValue = new OptionSetValue(optionValue);
                    if (optionSetValueCollection.Contains(optionSetValue))
                    {
                        continue;
                    }
                    optionSetValueCollection.Add(optionSetValue);
                }
                entity[schemaName] = optionSetValueCollection;
                Service.Update(entity);

            }
            catch (InvalidPluginExecutionException) { throw; }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException($"Unexpected error. {ex.Message}", ex);
            }
        }
    }
}