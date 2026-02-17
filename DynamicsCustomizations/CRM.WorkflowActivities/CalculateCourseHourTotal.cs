using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Sdk.Workflow;
using System;
using System.Activities;

namespace CRM.CustomWorkflow
{
    /// <summary>
    /// Program Application or Program Profile contains a collection of courses
    /// Each course is of a certain Program Type, Basic, ITE, SNE
    /// By providing either Program Application ER
    /// or Program Profile ER
    /// Calculate the Total Hours of Each Type
    /// </summary>
    public class CalculateCourseHourTotal : CodeActivity
    {
        [Input("Program Application")]
        [ReferenceTarget("ecer_postsecondaryinstituteprogramapplicaiton")]
        public InArgument<EntityReference> ProgramApplicationInArgument { get; set; }

        [Input("Program Profile")]
        [ReferenceTarget("ecer_program")]
        public InArgument<EntityReference> ProgramProfileInArgument { get; set; }

        [Output("BasicHoursSubtotal")]
        public OutArgument<decimal> BasicHoursSubtotalOutArgument { get; set; }

        [Output("NewBasicHoursSubtotal")]
        public OutArgument<decimal> BasicNewHoursSubtotalOutArgument { get; set; }

        [Output("ITEHoursSubtotal")]
        public OutArgument<decimal> ITEHoursSubtotalOutArgument { get; set; }

        [Output("NewITEHoursSubtotal")]
        public OutArgument<decimal> ITENewHoursSubtotalOutArgument { get; set; }

        [Output("SNEHoursSubtotal")]
        public OutArgument<decimal> SNEHoursSubtotalOutArgument { get; set; }

        [Output("NewSNEHoursSubtotal")]
        public OutArgument<decimal> SNENewHoursSubtotalOutArgument { get; set; }

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

                Tracing.Trace(
                "Entered WorkflowActivityTest.Execute(), Activity Instance Id: {0}, Workflow Instance Id: {1}",
                activityContext.ActivityInstanceId,
                activityContext.WorkflowInstanceId);

                Tracing.Trace("WorkflowActivityTest.Execute(), Correlation Id: {0}, Initiating User: {1}",
                Workflow.CorrelationId,
                Workflow.InitiatingUserId);
                var basicSubTotal = 0m;
                var basicNewSubTotal = 0m;
                var iteSubTotal = 0m;
                var iteNewSubTotal = 0m;
                var sneSubTotal = 0m;
                var sneNewSubTotal = 0m;
                var programApplicationER = ProgramApplicationInArgument.Get(activityContext);
                var programProfileER = ProgramProfileInArgument.Get(activityContext);

                BasicHoursSubtotalOutArgument.Set(activityContext, basicSubTotal);
                BasicNewHoursSubtotalOutArgument.Set(activityContext, basicNewSubTotal);
                ITEHoursSubtotalOutArgument.Set(activityContext, iteSubTotal);
                ITENewHoursSubtotalOutArgument.Set(activityContext, iteNewSubTotal);
                SNEHoursSubtotalOutArgument.Set(activityContext, sneSubTotal);
                SNENewHoursSubtotalOutArgument.Set(activityContext, sneNewSubTotal);

                if ((programApplicationER == null && programProfileER == null) ||
                    (programApplicationER != null && programProfileER != null))
                {
                    Tracing.Trace("Incorrect Configuration: Neither Program Profile and Program Application contains data or both contain data");
                    // Return;
                }

                // Obtain all active course area of instruction record under this course
                var query = new QueryExpression("ecer_course") { ColumnSet = new ColumnSet(true) };
                query.Criteria.AddCondition("statecode", ConditionOperator.Equal, 0); // Active
                if (programApplicationER != null && programProfileER == null)
                {
                    Tracing.Trace($"Query for Program Application Courses - Program Application: {programApplicationER.Id}");
                    query.Criteria.AddCondition("ecer_programapplication", ConditionOperator.Equal, programApplicationER.Id);
                }
                else if (programProfileER != null && programApplicationER == null)
                {
                    Tracing.Trace($"Query for Program Profile Courses - Program Profile: {programProfileER.Id}");
                    query.Criteria.AddCondition("ecer_programid", ConditionOperator.Equal, programProfileER.Id);
                }
                var results = Service.RetrieveMultiple(query);
                Tracing.Trace($"There are {results.Entities.Count} active courses in result set");
                foreach(var record in results.Entities)
                {
                    var hours = 0m;
                    var newHours = 0m;
                    if (!record.Contains("ecer_coursehourdecimal"))
                    {
                        Tracing.Trace("Record does not contain attribute ecer_coursehourdecimal");
                    }
                    if (!record.Contains("ecer_newcoursehourdecimal"))
                    {
                        Tracing.Trace("Record does not contain attribute ecer_newcoursehourdecimal");
                    }
                    if (record.GetAttributeValue<decimal?>("ecer_coursehourdecimal").HasValue)
                    {
                        
                        hours = record.GetAttributeValue<decimal>("ecer_coursehourdecimal");
                    }

                    if (record.GetAttributeValue<decimal?>("ecer_newcoursehourdecimal").HasValue && 
                        record.GetAttributeValue<decimal>("ecer_newcoursehourdecimal") >= 0)
                    {
                        newHours = record.GetAttributeValue<decimal>("ecer_newcoursehourdecimal");
                    }
                    else
                    {
                        newHours = hours;
                    }

                    Tracing.Trace($"Hours: {hours}; New Hours: {newHours}");
                    var programType = record.GetAttributeValue<OptionSetValue>("ecer_programtype");
                    if (programType != null)
                    {
                        var programTypeValue = programType.Value;
                        Tracing.Trace($"Program Type Value: {programTypeValue}");
                        switch (programTypeValue)
                        {
                            case 621870000: // Basic
                                basicSubTotal += hours;
                                basicNewSubTotal += newHours;
                                Tracing.Trace($"Basic Subtotal: {basicSubTotal}; New Basic Subtotal:{basicNewSubTotal}");
                                break;
                            case 621870001: // ITE
                                iteSubTotal += hours;
                                iteNewSubTotal += newHours;
                                Tracing.Trace($"ITE Subtotal: {iteSubTotal}; New ITE Subtotal:{iteNewSubTotal}");
                                break;
                            case 621870002: // SNE
                                sneSubTotal += hours;
                                sneNewSubTotal += newHours;
                                Tracing.Trace($"SNE Subtotal: {sneSubTotal}; New SNE Subtotal:{sneNewSubTotal}");
                                break;
                        }
                    }
                    else
                    {
                        Tracing.Trace($"Course Record ID: {record.Id} does not contain Program Type");
                    }
                }

                Tracing.Trace("Before Setting output:");
                Tracing.Trace($"Basic Subtotal: {basicSubTotal}; New Basic Subtotal:{basicNewSubTotal}");
                Tracing.Trace($"ITE Subtotal: {iteSubTotal}; New ITE Subtotal:{iteNewSubTotal}");
                Tracing.Trace($"SNE Subtotal: {sneSubTotal}; New SNE Subtotal:{sneNewSubTotal}");

                BasicHoursSubtotalOutArgument.Set(activityContext, basicSubTotal);
                BasicNewHoursSubtotalOutArgument.Set(activityContext, basicNewSubTotal);
                ITEHoursSubtotalOutArgument.Set(activityContext, iteSubTotal);
                ITENewHoursSubtotalOutArgument.Set(activityContext, iteNewSubTotal);
                SNEHoursSubtotalOutArgument.Set(activityContext, sneSubTotal);
                SNENewHoursSubtotalOutArgument.Set(activityContext, sneNewSubTotal);
            }
            catch (InvalidPluginExecutionException) { throw; }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException($"Unexpected error. {ex.Message}", ex);
            }
        }
    }
}