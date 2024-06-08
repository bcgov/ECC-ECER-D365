using System;
using System.Collections.Generic;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace BCGOV.Plugin.DocumentUrl
{
    public class CreateDocumentHierarchy : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            IPluginExecutionContext context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            IOrganizationServiceFactory serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            ITracingService traceService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

            traceService.Trace("Initializing plugin..");

            try
            {
                #region Validations
                if (context.InputParameters == null)
                    throw new InvalidPluginExecutionException("Context Input Parameters is null..");
                if (!context.InputParameters.Contains("Target"))
                    throw new InvalidPluginExecutionException("Context Input Parameters doesn't contain a Target..");
                if (!(context.InputParameters["Target"] is Entity))
                    throw new InvalidPluginExecutionException("Context Target is not an Entity..");
                if (context.PostEntityImages == null)
                    throw new InvalidPluginExecutionException("Context Post Image Collection is empty..");
                if (!context.PostEntityImages.Contains("PostImage"))
                    throw new InvalidPluginExecutionException("Context Post Image is empty..");
                if (!(context.PostEntityImages["PostImage"] is Entity))
                    throw new InvalidPluginExecutionException("Context Post Image is not an Entity..");
                #endregion

                var targetEntity = context.InputParameters["Target"] as Entity;
                var postImageEntity = context.PostEntityImages["PostImage"] as Entity;

                Entity sharePointFileUrlEntity = new Entity("bcgov_documenturl");
                sharePointFileUrlEntity.Id = targetEntity.Id;

                if (targetEntity.Contains("ecer_applicationid") && targetEntity["ecer_applicationid"] != null)
                {
                    // If Application, then also link to the applicant
                    var applicationER = (EntityReference)targetEntity["ecer_applicationid"];
                    var applicationEntity = service.Retrieve(applicationER.LogicalName.ToLowerInvariant(), applicationER.Id, new ColumnSet("ecer_applicantid"));
                    if (applicationEntity.Contains("ecer_applicantid") && applicationEntity["ecer_applicantid"] != null)
                    {
                        sharePointFileUrlEntity["bcgov_customer"] = applicationEntity["ecer_applicantid"];
                        service.Update(sharePointFileUrlEntity);
                    }
                }

                if (targetEntity.Contains("ecer_previousnameid") && targetEntity["ecer_previousnameid"] != null)
                {
                    // If Application, then also link to the applicant
                    var entityReference = (EntityReference)targetEntity["ecer_previousnameid"];
                    var entityRecord = service.Retrieve(entityReference.LogicalName.ToLowerInvariant(), entityReference.Id, new ColumnSet("ecer_contactid"));
                    if (entityRecord.Contains("ecer_contactid") && entityRecord["ecer_contactid"] != null)
                    {
                        sharePointFileUrlEntity["bcgov_customer"] = entityRecord["ecer_contactid"];
                        service.Update(sharePointFileUrlEntity);
                    }
                }

                if (targetEntity.Contains("bcgov_caseid") && targetEntity["bcgov_caseid"] != null)
                {
                    var caseId = (EntityReference)targetEntity["bcgov_caseid"];
                    var caseEntity = service.Retrieve(caseId.LogicalName.ToLowerInvariant(), caseId.Id, new ColumnSet("customerid"));
                    if (caseEntity.Contains("customerid") && caseEntity["customerid"] != null)
                    {
                        sharePointFileUrlEntity["bcgov_customer"] = caseEntity["customerid"];
                        service.Update(sharePointFileUrlEntity);
                    }
                }

                if (targetEntity.Contains("bcgov_emailid") && targetEntity["bcgov_emailid"] != null)
                {
                    var emailId = (EntityReference)targetEntity["bcgov_emailid"];
                    var emailEntity = service.Retrieve(emailId.LogicalName.ToLowerInvariant(), emailId.Id, new ColumnSet("regardingobjectid"));
                    if (emailEntity.Contains("regardingobjectid") && emailEntity["regardingobjectid"] != null)
                    {
                        if (((EntityReference)emailEntity["regardingobjectid"]).LogicalName.Equals("incident"))
                        {
                            sharePointFileUrlEntity["bcgov_caseid"] = emailEntity["regardingobjectid"];
                            service.Update(sharePointFileUrlEntity);
                        }
                        else if (((EntityReference)emailEntity["regardingobjectid"]).LogicalName.Equals("account"))
                        {
                            sharePointFileUrlEntity["bcgov_customer"] = emailEntity["regardingobjectid"];
                            service.Update(sharePointFileUrlEntity);
                        }
                        else if (((EntityReference)emailEntity["regardingobjectid"]).LogicalName.Equals("contact"))
                        {
                            sharePointFileUrlEntity["bcgov_customer"] = emailEntity["regardingobjectid"];
                            service.Update(sharePointFileUrlEntity);
                        }
                    }
                }

                if (targetEntity.Contains("bcgov_faxid") && targetEntity["bcgov_faxid"] != null)
                {
                    var faxId = (EntityReference)targetEntity["bcgov_faxid"];
                    var faxEntity = service.Retrieve(faxId.LogicalName.ToLowerInvariant(), faxId.Id, new ColumnSet("regardingobjectid"));
                    if (faxEntity.Contains("regardingobjectid") && faxEntity["regardingobjectid"] != null)
                    {
                        if (((EntityReference)faxEntity["regardingobjectid"]).LogicalName.Equals("incident"))
                        {
                            sharePointFileUrlEntity["bcgov_caseid"] = faxEntity["regardingobjectid"];
                            service.Update(sharePointFileUrlEntity);
                        }
                        else if (((EntityReference)faxEntity["regardingobjectid"]).LogicalName.Equals("account"))
                        {
                            sharePointFileUrlEntity["bcgov_customer"] = faxEntity["regardingobjectid"];
                            service.Update(sharePointFileUrlEntity);
                        }
                        else if (((EntityReference)faxEntity["regardingobjectid"]).LogicalName.Equals("contact"))
                        {
                            sharePointFileUrlEntity["bcgov_customer"] = faxEntity["regardingobjectid"];
                            service.Update(sharePointFileUrlEntity);
                        }
                    }
                }

                if (targetEntity.Contains("bcgov_letterid") && targetEntity["bcgov_letterid"] != null)
                {
                    var letterId = (EntityReference)targetEntity["bcgov_letterid"];
                    var letterEntity = service.Retrieve(letterId.LogicalName.ToLowerInvariant(), letterId.Id, new ColumnSet("regardingobjectid"));
                    if (letterEntity.Contains("regardingobjectid") && letterEntity["regardingobjectid"] != null)
                    {
                        if (((EntityReference)letterEntity["regardingobjectid"]).LogicalName.Equals("incident"))
                        {
                            sharePointFileUrlEntity["bcgov_caseid"] = letterEntity["regardingobjectid"];
                            service.Update(sharePointFileUrlEntity);
                        }
                        else if (((EntityReference)letterEntity["regardingobjectid"]).LogicalName.Equals("account"))
                        {
                            sharePointFileUrlEntity["bcgov_customer"] = letterEntity["regardingobjectid"];
                            service.Update(sharePointFileUrlEntity);
                        }
                        else if (((EntityReference)letterEntity["regardingobjectid"]).LogicalName.Equals("contact"))
                        {
                            sharePointFileUrlEntity["bcgov_customer"] = letterEntity["regardingobjectid"];
                            service.Update(sharePointFileUrlEntity);
                        }
                    }
                }

                if (targetEntity.Contains("bcgov_appointmentid") && targetEntity["bcgov_appointmentid"] != null)
                {
                    var appointmentId = (EntityReference)targetEntity["bcgov_appointmentid"];
                    var appointmentEntity = service.Retrieve(appointmentId.LogicalName.ToLowerInvariant(), appointmentId.Id, new ColumnSet("regardingobjectid"));
                    if (appointmentEntity.Contains("regardingobjectid") && appointmentEntity["regardingobjectid"] != null)
                    {
                        if (((EntityReference)appointmentEntity["regardingobjectid"]).LogicalName.Equals("incident"))
                        {
                            sharePointFileUrlEntity["bcgov_caseid"] = appointmentEntity["regardingobjectid"];
                            service.Update(sharePointFileUrlEntity);
                        }
                        else if (((EntityReference)appointmentEntity["regardingobjectid"]).LogicalName.Equals("account"))
                        {
                            sharePointFileUrlEntity["bcgov_customer"] = appointmentEntity["regardingobjectid"];
                            service.Update(sharePointFileUrlEntity);
                        }
                        else if (((EntityReference)appointmentEntity["regardingobjectid"]).LogicalName.Equals("contact"))
                        {
                            sharePointFileUrlEntity["bcgov_customer"] = appointmentEntity["regardingobjectid"];
                            service.Update(sharePointFileUrlEntity);
                        }
                    }
                }

                if (targetEntity.Contains("bcgov_phonecallid") && targetEntity["bcgov_phonecallid"] != null)
                {
                    var phoneCallId = (EntityReference)targetEntity["bcgov_phonecallid"];
                    var phoneCallEntity = service.Retrieve(phoneCallId.LogicalName.ToLowerInvariant(), phoneCallId.Id, new ColumnSet("regardingobjectid"));
                    if (phoneCallEntity.Contains("regardingobjectid") && phoneCallEntity["regardingobjectid"] != null)
                    {
                        if (((EntityReference)phoneCallEntity["regardingobjectid"]).LogicalName.Equals("incident"))
                        {
                            sharePointFileUrlEntity["bcgov_caseid"] = phoneCallEntity["regardingobjectid"];
                            service.Update(sharePointFileUrlEntity);
                        }
                        else if (((EntityReference)phoneCallEntity["regardingobjectid"]).LogicalName.Equals("account"))
                        {
                            sharePointFileUrlEntity["bcgov_customer"] = phoneCallEntity["regardingobjectid"];
                            service.Update(sharePointFileUrlEntity);
                        }
                        else if (((EntityReference)phoneCallEntity["regardingobjectid"]).LogicalName.Equals("contact"))
                        {
                            sharePointFileUrlEntity["bcgov_customer"] = phoneCallEntity["regardingobjectid"];
                            service.Update(sharePointFileUrlEntity);
                        }
                    }
                }

                if (targetEntity.Contains("bcgov_taskid") && targetEntity["bcgov_taskid"] != null)
                {
                    var taskId = (EntityReference)targetEntity["bcgov_taskid"];
                    var taskEntity = service.Retrieve(taskId.LogicalName.ToLowerInvariant(), taskId.Id, new ColumnSet("regardingobjectid"));
                    if (taskEntity.Contains("regardingobjectid") && taskEntity["regardingobjectid"] != null)
                    {
                        if (((EntityReference)taskEntity["regardingobjectid"]).LogicalName.Equals("incident"))
                        {
                            sharePointFileUrlEntity["bcgov_caseid"] = taskEntity["regardingobjectid"];
                            service.Update(sharePointFileUrlEntity);
                        }
                        else if (((EntityReference)taskEntity["regardingobjectid"]).LogicalName.Equals("account"))
                        {
                            sharePointFileUrlEntity["bcgov_customer"] = taskEntity["regardingobjectid"];
                            service.Update(sharePointFileUrlEntity);
                        }
                        else if (((EntityReference)taskEntity["regardingobjectid"]).LogicalName.Equals("contact"))
                        {
                            sharePointFileUrlEntity["bcgov_customer"] = taskEntity["regardingobjectid"];
                            service.Update(sharePointFileUrlEntity);
                        }
                    }
                }
            }
            catch (FaultException<OrganizationServiceFault> ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
                var userMessage = "An error occurred in the CreateDocumentHierarchy plugin.." + ex.Message;
                throw new InvalidPluginExecutionException(userMessage);
            }
            catch (Exception ex)
            {
                traceService.Trace("Exception: " + ex.Message + " " + ex.StackTrace);
                var userMessage = "An error occurred in the CreateDocumentHierarchy plugin.." + ex.Message;
                throw new InvalidPluginExecutionException(userMessage);
            }
        }
    }
}
