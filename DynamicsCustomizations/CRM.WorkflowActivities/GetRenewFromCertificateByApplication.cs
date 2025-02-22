using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Sdk.Workflow;
using System;
using System.Activities;

namespace CRM.CustomWorkflow
{
    /// <summary>
    /// Obtain Renewed From Certificate and some related data
    /// Is Renewal? (boolean)
    /// Is Late Renewal? (Certificate Date compare to Application Submission Date)
    /// Application Certificate Type
    /// </summary>
    public class GetRenewFromCertificateByApplication : CodeActivity
    {
        [Input("Application")]
        [RequiredArgument]
        [ReferenceTarget("ecer_application")]
        public InArgument<EntityReference> ApplicationInArgument { get; set; }

        [Output("Is Renewal")]
        public OutArgument<bool> IsRenewalOutput { get; set; }

        [Output("Renewed From Certificate")]
        [ReferenceTarget("ecer_certificate")]
        public OutArgument<EntityReference> RenewedFromCertificateOutput { get; set; }

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

                var applicationER = ApplicationInArgument.Get(activityContext);

                EntityReference renewFromCertificateER = null;

                // Obtain the Application record
                var applicationRecord = Service.Retrieve(applicationER.LogicalName, applicationER.Id, new Microsoft.Xrm.Sdk.Query.ColumnSet(true));
                var fromCertificateER = applicationRecord.GetAttributeValue<EntityReference>("ecer_fromcertificateid");
                var applicationTypeOS = applicationRecord.GetAttributeValue<OptionSetValue>("ecer_type");
                var isRenewal = applicationTypeOS != null && applicationTypeOS.Value == 621870001; // Renewals
                // If there is one already defined.  Then, honor the one that is picked by user
                if (fromCertificateER != null)
                {
                    renewFromCertificateER = fromCertificateER;
                    Tracing.Trace($"{CustomCodeHelper.LineNumber()}: Renewal Certificate: {renewFromCertificateER.Id} - {renewFromCertificateER.Name}");
                }
                else
                {
                    var applicantER = applicationRecord.GetAttributeValue<EntityReference>("ecer_applicantid");
                    var applicantIdString = applicantER.Id.ToString("D");
                    var isECEAssistant = applicationRecord.GetAttributeValue<bool>("ecer_iseceassistant");
                    var isECE1Yr = applicationRecord.GetAttributeValue<bool>("ecer_isece1yr");
                    var isECE5Yr = applicationRecord.GetAttributeValue<bool>("ecer_isece5yr");
                    var isSNE = applicationRecord.GetAttributeValue<bool>("ecer_issne");
                    var isITE = applicationRecord.GetAttributeValue<bool>("ecer_isite");
                    var submissionDateNullable = applicationRecord.GetAttributeValue<Nullable<DateTime>>("ecer_datesubmitted");
                    var submissionDate = DateTime.Today;
                    if (submissionDateNullable.HasValue)
                    {
                        submissionDate = submissionDateNullable.Value;
                    }
                    var is5Yr = isECE5Yr || isSNE || isITE;

                    Tracing.Trace($"{CustomCodeHelper.LineNumber()}: Is Renewal By Application Type: {isRenewal}");
                    if (isRenewal)
                    {
                        var query = new QueryExpression("ecer_certificate") { ColumnSet = new ColumnSet(true) };
                        query.Criteria.AddCondition("statecode", ConditionOperator.Equal, 0); // Active
                        query.Criteria.AddCondition("ecer_registrantid", ConditionOperator.Equal, applicantER.Id); // To the applicant of the application

                        var linkedCertifiedLevels = new LinkEntity(
                            linkFromEntityName: "ecer_certificate",
                            linkToEntityName: "ecer_certifiedlevel",
                            linkFromAttributeName: "ecer_certificateid",
                            linkToAttributeName: "ecer_certificateid",
                            joinOperator: JoinOperator.Inner);

                        FilterExpression linkEntityExpression = new FilterExpression(LogicalOperator.And);
                        if (is5Yr || isSNE || isITE)
                        {
                            linkEntityExpression.AddCondition("ecer_certificatetypeid", ConditionOperator.Equal, new Guid("6C5424EB-9673-EE11-8179-000D3AF4FA73"));
                        }
                        else if (isECE1Yr)
                        {
                            linkEntityExpression.AddCondition("ecer_certificatetypeid", ConditionOperator.Equal, new Guid("D093C93D-7BE1-EE11-904C-0022486E0199"));
                        }
                        else if (isECEAssistant)
                        {
                            linkEntityExpression.AddCondition("ecer_certificatetypeid", ConditionOperator.Equal, new Guid("D593C93D-7BE1-EE11-904C-0022486E0199"));
                        }
                        linkedCertifiedLevels.LinkCriteria = linkEntityExpression;
                        query.LinkEntities.Add(linkedCertifiedLevels);

                        /* Alternate Fetch XML
                        // Look for the Certificate this is renewed from
                        var fetchXML = "<fetch distinct='true' count='1'>" +
                            "<entity name='ecer_certificate'>" +
                            "<attribute name='ecer_certificateid' />" +
                            "<attribute name='ecer_expirydate' />" +
                            "<attribute name='ecer_effectivedate' />" +
                            "<attribute name='ecer_hasconditions' />" +
                            "<order attribute='ecer_effectivedate' descending='true' />" +
                            "<filter type='and'>" +
                                $"<condition attribute='ecer_registrantid' operator='eq' value='{applicantIdString}' />" +
                                "<condition attribute='statecode' operator='eq' value='0' />" +
                            "</filter>" +
                            "<link-entity name='ecer_certifiedlevel' from='ecer_certificateid' to='ecer_certificateid' link-type='inner' alias='ab'>" +
                                "<filter type='and'>";
                        if (is5Yr)
                        {
                            fetchXML += "<condition attribute='ecer_certificatetypeid' operator='eq' value='{6C5424EB-9673-EE11-8179-000D3AF4FA73}' />";
                        }
                        else if (isECE1Yr)
                        {
                            fetchXML += "<condition attribute='ecer_certificatetypeid' operator='eq' value='{D093C93D-7BE1-EE11-904C-0022486E0199}' />";
                        }
                        else if (isECEAssistant)
                        {
                            fetchXML += "<condition attribute='ecer_certificatetypeid' operator='eq' value='{D593C93D-7BE1-EE11-904C-0022486E0199}' />";
                        }
                        fetchXML += "</filter>" +
                            "</link-entity>" +
                            "</entity>" +
                            "</fetch>";

                        var results = Service.RetrieveMultiple(new Microsoft.Xrm.Sdk.Query.FetchExpression(fetchXML));
                        */
                        var results = Service.RetrieveMultiple(query);
                        if (results.Entities.Count > 0)
                        {
                            renewFromCertificateER = results.Entities[0].ToEntityReference();
                            isRenewal = true;
                            Tracing.Trace($"{CustomCodeHelper.LineNumber()}: Renewal Certificate: {renewFromCertificateER.Id} - {renewFromCertificateER.Name}");
                        }
                        else
                        {
                            isRenewal = false; // Nothing match to renew from
                        }
                        Tracing.Trace($"{CustomCodeHelper.LineNumber()}: Is Renewal By Query: {isRenewal}");

                    }
                }

                IsRenewalOutput.Set(activityContext, isRenewal);
                RenewedFromCertificateOutput.Set(activityContext, renewFromCertificateER);

            }
            catch (InvalidPluginExecutionException) { throw; }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException($"Unexpected error. {ex.Message}", ex);
            }
        }
    }
}