using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Client;
using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Tooling.Connector;
using FileHelpers;
using System.Net;
using System.ServiceModel.Description;
using System.Collections;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Metadata;
using System.Text.RegularExpressions;
using CrmEarlyBound;
using System.Configuration;
using System.Web.Services.Description;
using System.Runtime.ConstrainedExecution;
using System.Data.Common;
using System.Threading;

namespace ECER
{
    public class DataUpdates 
    {
        static void Main(string[] args)
        {
            try
            {
                string connectionString = $"AuthType=Office365;Url=https://myeceregistry.crm3.dynamics.com/;Username=;Password=";
                CrmServiceClient service = new CrmServiceClient(connectionString);
                IOrganizationService _orgService;
                _orgService = (IOrganizationService)service.OrganizationWebProxyClient != null ? (IOrganizationService)service.OrganizationWebProxyClient : (IOrganizationService)service.OrganizationServiceProxy;
                OrganizationServiceContext orgContext = new OrganizationServiceContext(_orgService);

                DataUpdates d = new DataUpdates();

                //d.SetCertificateLevels(orgContext, _orgService);

                DataUpdates.Containers Containers = new DataUpdates.Containers();
                Containers.MapCertLevelsFromExcel(_orgService, orgContext);

               // d.CreateMissingCertifiedLevels(orgContext, _orgService);

               // d.SetOriginalExpiryDatesForCertsCreatedIn2007(orgContext, _orgService);

                // d.SetWorkExperienceHours(orgContext, _orgService);

                // d.SetAssistantCertsToInactive(orgContext, _orgService);

                // d.SetEducationOriginOnApplications(orgContext, _orgService);

                // d.ConnectNewCertsToApps(orgContext, _orgService);

            }
            catch (Exception ex)
            {

            }

        }

        public void SetCertificateLevels(OrganizationServiceContext orgContext, IOrganizationService _orgService) {

            var certificates = (from c in orgContext.CreateQuery<ecer_Certificate>()
                                    //where c.ecer_CertificateNumber == Convert.ToString(10018)
                                where c.ecer_CertificateLevel.Contains("5") ||
                                c.ecer_CertificateLevel.Contains("ITE") ||
                                c.ecer_CertificateLevel.Contains("SNE")
                                select c).ToList();

            foreach (var cert in certificates) {
                if (cert.ecer_legacyapplicationid != null) { 


                    var application = (from c in orgContext.CreateQuery<ecer_Application>()
                                        where c.ecer_LegacyApplicationID == cert.ecer_legacyapplicationid.ToString()
                                        select c).FirstOrDefault();

                    string certifiedLevel = "";

                    if (application != null) {
                        if (application.ecer_isECE5YR == true && (application.ecer_isITE == false || application.ecer_isITE == null) && (application.ecer_isSNE == false || application.ecer_isSNE == null)) {
                            certifiedLevel = "ECE 5 YR";
                        }
                        else if (application.ecer_isITE == true && (application.ecer_isSNE == false || application.ecer_isSNE == null)) {
                            certifiedLevel = "ECE 5 YR ITE";
                        }
                        else if (application.ecer_isSNE == true && (application.ecer_isITE == false || application.ecer_isITE == null))
                        {
                            certifiedLevel = "ECE 5 YR SNE";
                        }
                        else if (application.ecer_isSNE == true && application.ecer_isITE == true)
                        {
                            certifiedLevel = "ECE 5 YR ITE SNE";
                        }

                        if (certifiedLevel != "" && certifiedLevel != cert.ecer_CertificateLevel) {
                            ecer_Certificate certUpdate = new ecer_Certificate();
                            certUpdate.Id = cert.Id;
                            certUpdate.ecer_CertificateLevel = certifiedLevel;
                            _orgService.Update(certUpdate);
                        }
                    }
                }
            }
        }

        public void SetOriginalExpiryDatesForCertsCreatedIn2007(OrganizationServiceContext orgContext, IOrganizationService _orgService)
        {
            DateTime newdate = new DateTime(2007, 09, 09);


            var certificates = (from c in orgContext.CreateQuery<ecer_Certificate>()
                                where c.CreatedOn <= newdate &&
                                c.ecer_ExpiryDate != null
                                select c).ToList();

            foreach (var cert in certificates)
            {
                if (cert.ecer_legacyexpirydate != null) {
                    ecer_Certificate certUpdate = new ecer_Certificate();
                    certUpdate.Id = cert.Id;
                    certUpdate.ecer_ExpiryDate = cert.ecer_legacyexpirydate;
                    _orgService.Update(certUpdate);
                }
            }
        }
        public void SetAssistantCertsToInactive(OrganizationServiceContext orgContext, IOrganizationService _orgService)
        {
            var certificates = (from c in orgContext.CreateQuery<ecer_Certificate>()
                                where c.StatusCode.Equals(1) &&
                                c.ecer_CertificateLevel.Contains("ASST")
                                select c).ToList();

            foreach (var activeAsstCert in certificates)
            {
                var otherCerts = (from c in orgContext.CreateQuery<ecer_Certificate>()
                                    where c.StatusCode.Equals(1) &&
                                    c.ecer_CertificateLevel.Contains("1 YR") &&
                                    c.ecer_Registrantid == activeAsstCert.ecer_Registrantid
                                    select c).ToList();

                if (otherCerts.Count > 0) {

                    foreach (var oneYearCert in otherCerts) {
                        if (activeAsstCert.ecer_ExpiryDate != null && oneYearCert.ecer_ExpiryDate != null) {

                            if (oneYearCert.ecer_EffectiveDate > activeAsstCert.ecer_EffectiveDate) {
                                //ecer_Certificate certUpdate = new ecer_Certificate();
                                //certUpdate.Id = activeAsstCert.Id;
                                //certUpdate.StateCode.Equals(0);
                                //certUpdate.StatusCode.Equals(2);
                                //_orgService.Update(certUpdate);


                                //SetStateRequest request = new SetStateRequest
                                //{
                                //    EntityMoniker = new EntityReference("ecer_Certificate", activeAsstCert.Id),
                                //    State = new OptionSetValue(1),
                                //    Status = new OptionSetValue(2)
                                //};
                                //_orgService.Execute(request);

                                Entity party = new Entity("ecer_certificate", activeAsstCert.Id);
                                party["statecode"] = new OptionSetValue(1); //Status
                                party["statuscode"] = new OptionSetValue(2); //Status reason
                                _orgService.Update(party);


                            }
                        }
                    }
                }
            }
        }

        public void SetWorkExperienceHours(OrganizationServiceContext orgContext, IOrganizationService _orgService)
        {
            var workExperienceAssessments = (from c in orgContext.CreateQuery<ecer_WorkExperienceAssessment>()
                                             where c.ecer_Approved.Equals(621870000)
                                             select c).ToList();

            foreach (var weAssmt in workExperienceAssessments)
            {
                var workExperienceRef = (from c in orgContext.CreateQuery<ecer_WorkExperienceRef>()
                                         where c.ecer_WorkExperienceRefId == weAssmt.ecer_WorkExpRefId.Id
                                         select c).FirstOrDefault();

                if (workExperienceRef.ecer_TotalNumberofHoursObserved != null) {
                    ecer_WorkExperienceAssessment weAssmtUpdate = new ecer_WorkExperienceAssessment();
                    weAssmtUpdate.Id = weAssmt.Id;
                    weAssmtUpdate.ecer_TotalNumberofHoursApproved = workExperienceRef.ecer_TotalNumberofHoursApproved;
                    _orgService.Update(weAssmtUpdate);
                }
            }
        }

        [DelimitedRecord(",")]
        [IgnoreEmptyLines()]
        [IgnoreFirst(1)]
        public class Containers
        {
            public String ecer_legacyclientid { get; set; }

            public String cert_id { get; set; }

           // public String appl_id { get; set; }

            public String educ_lvl_oracle { get; set; }

            public String effective_date { get; set; }

            public String cert_level_dynamics { get; set; }

            public void MapCertLevelsFromExcel(IOrganizationService _orgService, OrganizationServiceContext orgContext)
            {
                try
                {
                    //file location, better to get it from configuration
                   // string fileName = "C:/Users/AaronT/Desktop/ECER/CESA_Accounts/cert.csv";
                   string fileName = "C:/Users/AaronT/Desktop/ECER/CESA_Accounts/certs4.csv";
                   // string fileName = "C:/Users/AaronT/Desktop/ECER/CESA_Accounts/duplicate.csv";
                    //create a CSV engine using FileHelpers for your CSV file
                    var engine = new FileHelperEngine(typeof(Containers));
                    //read the CSV file into your object Arrary
                    var containers = (Containers[])engine.ReadFile(fileName);

                    if (containers.Any())
                    {
                        //process your records as per your requirements
                        foreach (var container in containers)
                        {
                            Contact client = null;
                            ecer_Certificate certificate = null; 
                            ecer_Certificate certificate2 = null; 
                            ecer_Certificate certificate3 = null;
                            DateTime? first = null;
                            DateTime? second = null;

                            if (container.educ_lvl_oracle != container.cert_level_dynamics) {

                                //var duplicateCertificates = (from c in orgContext.CreateQuery<ecer_Certificate>()
                                //                             where c.ecer_CertificateNumber == container.ecer_legacyclientid &&
                                //                             c.ecer_EffectiveDate == Convert.ToDateTime(container.effective_date)
                                //                             select c).ToList();

                                //if (duplicateCertificates.Count == 2)
                                //{
                                //    first = duplicateCertificates[0].ecer_ExpiryDate;
                                //    second = duplicateCertificates[1].ecer_ExpiryDate;

                                //    if (first == second)
                                //    {
                                //        if (duplicateCertificates[0].ecer_CertificateLevel == "ECE 5 YR" && (duplicateCertificates[1].ecer_CertificateLevel == "ECE 5 YR ITE" || duplicateCertificates[1].ecer_CertificateLevel == "ECE 5 YR SNE" || duplicateCertificates[1].ecer_CertificateLevel == "ECE 5 YR ITE SNE"))
                                //        {
                                //            if (duplicateCertificates[0].ecer_legacycertificateid == container.cert_id)
                                //            {
                                //                _orgService.Delete("ecer_certificate", duplicateCertificates[0].Id);
                                //            }
                                //            else
                                //            {
                                //                _orgService.Delete("ecer_certificate", duplicateCertificates[1].Id);
                                //            }
                                //        }
                                //        if (duplicateCertificates[1].ecer_CertificateLevel == "ECE 5 YR" && (duplicateCertificates[0].ecer_CertificateLevel == "ECE 5 YR ITE" || duplicateCertificates[0].ecer_CertificateLevel == "ECE 5 YR SNE" || duplicateCertificates[0].ecer_CertificateLevel == "ECE 5 YR ITE SNE"))
                                //        {
                                //            if (duplicateCertificates[0].ecer_legacycertificateid == container.cert_id)
                                //            {
                                //                _orgService.Delete("ecer_certificate", duplicateCertificates[0].Id);
                                //            }
                                //            else
                                //            {
                                //                _orgService.Delete("ecer_certificate", duplicateCertificates[1].Id);
                                //            }
                                //        }
                                //        if (duplicateCertificates[0].ecer_CertificateLevel == "ECE 5 YR ITE" && duplicateCertificates[1].ecer_CertificateLevel == "ECE 5 YR SNE")
                                //        {
                                //            if (duplicateCertificates[0].ecer_legacycertificateid == container.cert_id)
                                //            {
                                //                _orgService.Delete("ecer_certificate", duplicateCertificates[0].Id);
                                //            }
                                //            else
                                //            {
                                //                _orgService.Delete("ecer_certificate", duplicateCertificates[1].Id);
                                //            }
                                //        }
                                //        if (duplicateCertificates[1].ecer_CertificateLevel == "ECE 5 YR ITE" && duplicateCertificates[0].ecer_CertificateLevel == "ECE 5 YR SNE")
                                //        {
                                //            if (duplicateCertificates[0].ecer_legacycertificateid == container.cert_id)
                                //            {
                                //                _orgService.Delete("ecer_certificate", duplicateCertificates[0].Id);
                                //            }
                                //            else
                                //            {
                                //                _orgService.Delete("ecer_certificate", duplicateCertificates[1].Id);
                                //            }
                                //        }
                                //    }
                                //}
                                //else
                                //{
                                    client = (from c in orgContext.CreateQuery<Contact>()
                                              where c.ecer_ClientID == container.ecer_legacyclientid
                                              select c).FirstOrDefault();

                                    if (client != null)
                                    {
                                        certificate = (from c in orgContext.CreateQuery<ecer_Certificate>()
                                                       where c.ecer_legacycertificateid == container.cert_id
                                                       select c).FirstOrDefault();

                                        if (certificate != null)
                                        {
                                            string cert_level = "";
                                            string missing_level = "";

                                            //if (container.educ_lvl_oracle == "ECE 5 YR")
                                            //{
                                            //    cert_level = "ECE 5 YR";
                                            //}
                                            //else if (container.educ_lvl_oracle == "ITE")
                                            //{
                                            //    cert_level = "ECE 5 YR ITE";
                                            //}
                                            //else if (container.educ_lvl_oracle == "SNE")
                                            //{
                                            //    certificate3 = (from c in orgContext.CreateQuery<ecer_Certificate>()
                                            //                    where c.ecer_Registrantid.Id == client.Id &&
                                            //                    (c.ecer_EffectiveDate == Convert.ToDateTime(container.effective_date) ||
                                            //                    c.ecer_EffectiveDate == Convert.ToDateTime(container.effective_date).AddDays(1) ||
                                            //                    c.ecer_EffectiveDate == Convert.ToDateTime(container.effective_date).AddDays(-1))
                                            //                    select c).FirstOrDefault();

                                            //    if (certificate3.ecer_CertificateLevel.Contains("ECE 5 YR ITE SNE"))
                                            //    {
                                            //        cert_level = "ECE 5 YR SNE";
                                            //    }
                                            //    else if (certificate3.ecer_CertificateLevel.Contains("ITE"))
                                            //    {
                                            //        cert_level = "ECE 5 YR ITE SNE";
                                            //    }
                                            //    else
                                            //    {
                                            //        cert_level = "ECE 5 YR SNE";
                                            //    }
                                            //}
                                            //else if (container.educ_lvl_oracle == "ECE 1 YR")
                                            //{
                                            //    cert_level = "ECE 1 YR";
                                            //}
                                            //else if (container.educ_lvl_oracle == "ASST")
                                            //{
                                            //    cert_level = "ASST";
                                            //}
                                            //if (container.educ_lvl_oracle == "ECE 5 YR ITE" && container.cert_level_dynamics == "ECE 5 YR ITE SNE")
                                            //{
                                            //    cert_level = "ECE 5 YR ITE";
                                            //}
                                            if (container.educ_lvl_oracle == "ECE 5 YR ITE SNE" && container.cert_level_dynamics == "ECE 5 YR ITE")
                                            {
                                                cert_level = "ECE 5 YR ITE SNE";
                                                missing_level = "SNE";
                                            }
                                            else if (container.educ_lvl_oracle == "ECE 5 YR ITE SNE" && container.cert_level_dynamics == "ECE 5 YR SNE")
                                            {
                                                cert_level = "ECE 5 YR ITE SNE";
                                                missing_level = "ITE";
                                            }
                                            else if (container.educ_lvl_oracle == "ECE 5 YR ITE SNE" && container.cert_level_dynamics == "ECE 5 YR")
                                            {
                                                cert_level = "ECE 5 YR ITE SNE";
                                                missing_level = "ITE SNE";
                                            }
                                            else if (container.educ_lvl_oracle == "ECE 5 YR SNE" && container.cert_level_dynamics == "ECE 5 YR")
                                            {
                                                cert_level = "ECE 5 YR SNE";
                                                missing_level = "SNE";
                                            }
                                            else if (container.educ_lvl_oracle == "ECE 5 YR ITE" && container.cert_level_dynamics == "ECE 5 YR")
                                            {
                                                cert_level = "ECE 5 YR ITE";
                                                missing_level = "ITE";
                                            }
                                            else if (container.educ_lvl_oracle == "ECE 5 YR" && container.cert_level_dynamics == "ECE 5 YR ITE")
                                            {
                                                cert_level = "ECE 5 YR";
                                                missing_level = "ITEREMOVE";
                                            }
                                            else if (container.educ_lvl_oracle == "ECE 5 YR" && container.cert_level_dynamics == "ECE 5 YR SNE")
                                            {
                                                cert_level = "ECE 5 YR";
                                                missing_level = "SNEREMOVE";
                                            }
                                            else if (container.educ_lvl_oracle == "ECE 5 YR SNE" && container.cert_level_dynamics == "ECE 5 YR ITE")
                                            {
                                                cert_level = "ECE 5 YR SNE";
                                                missing_level = "ITEREMOVESNEADD";
                                            }
                                            else if (container.educ_lvl_oracle == "ECE 5 YR ITE" && container.cert_level_dynamics == "ECE 5 YR SNE")
                                            {
                                                cert_level = "ECE 5 YR ITE";
                                                missing_level = "SNEREMOVEITEADD";
                                            }
                                            else if (container.educ_lvl_oracle == "ECE 5 YR SNE" && container.cert_level_dynamics == "ECE 5 YR ITE SNE")
                                            {
                                                cert_level = "ECE 5 YR SNE";
                                                missing_level = "ITEREMOVE";
                                            }
                                            else if (container.educ_lvl_oracle == "ECE 5 YR ITE" && container.cert_level_dynamics == "ECE 5 YR ITE SNE")
                                            {
                                                cert_level = "ECE 5 YR SNE";
                                                missing_level = "SNEREMOVE";
                                            }
                                            else if (container.educ_lvl_oracle == "ECE 5 YR" && container.cert_level_dynamics == "ECE 5 YR ITE SNE")
                                            {
                                                cert_level = "ECE 5 YR";
                                                missing_level = "ITEANDSNEREMOVE";
                                            }
                                            else if (container.educ_lvl_oracle == "ECE 1 YR" && container.cert_level_dynamics == "ASST")
                                            {
                                                cert_level = "ECE 1 YR";
                                                missing_level = "1YRADDASSTREMOVE";
                                            }
                                            else if (container.educ_lvl_oracle == "ASST" && container.cert_level_dynamics == "ECE 1 YR")
                                            {
                                                cert_level = "ASST";
                                                missing_level = "ASSTADD1YRREMOVE";
                                            }
                                            else if (container.educ_lvl_oracle == "ASST" && container.cert_level_dynamics == "ECE 5 YR SNE")
                                            {
                                                cert_level = "ASST";
                                                missing_level = "ASSTADD5YRSNEREMOVE";
                                            }
                                            else if (container.educ_lvl_oracle == "ASST" && container.cert_level_dynamics == "ECE 5 YR")
                                            {
                                                cert_level = "ASST";
                                                missing_level = "ASSTADD5YRREMOVE";
                                            }
                                            else if (container.educ_lvl_oracle == "ASST" && container.cert_level_dynamics == "ECE 5 YR ITE SNE")
                                            {
                                                cert_level = "ASST";
                                                missing_level = "ASSTADD5YRITESNEREMOVE";
                                            }
                                            else if (container.educ_lvl_oracle == "ECE 1 YR" && container.cert_level_dynamics == "ECE 5 YR SNE")
                                            {
                                                cert_level = "ECE 1 YR";
                                                missing_level = "1YRADD5YRSNEREMOVE";
                                            }
                                            else if (container.educ_lvl_oracle == "ECE 1 YR" && container.cert_level_dynamics == "ECE 5 YR ITE SNE")
                                            {
                                                cert_level = "ECE 1 YR";
                                                missing_level = "1YRADD5YRITESNEREMOVE";
                                            }
                                            else if (container.educ_lvl_oracle == "ECE 1 YR" && container.cert_level_dynamics == "ECE 5 YR")
                                            {
                                                cert_level = "ECE 1 YR";
                                                missing_level = "1YRADD5YRREMOVE";
                                            }

                                        if (cert_level != "")
                                            {
                                                if (missing_level == "1YRADDASSTREMOVE" || missing_level == "1YRADD5YRSNEREMOVE" || missing_level == "1YRADD5YRREMOVE" || missing_level == "1YRADD5YRITESNEREMOVE") {
                                                    ecer_Certificate certUpdate = new ecer_Certificate();
                                                    certUpdate.Id = certificate.Id;
                                                    certUpdate.ecer_ExpiryDate = certificate.ecer_EffectiveDate.Value.AddYears(1);
                                                    certUpdate.ecer_CertificateLevel = cert_level;
                                                    _orgService.Update(certUpdate);
                                                }
                                                else if (missing_level == "ASSTADD1YRREMOVE") {
                                                    ecer_Certificate certUpdate = new ecer_Certificate();
                                                    certUpdate.Id = certificate.Id;
                                                    certUpdate.ecer_ExpiryDate = certificate.ecer_EffectiveDate.Value.AddYears(5);
                                                    certUpdate.ecer_CertificateLevel = cert_level;
                                                    _orgService.Update(certUpdate);
                                                }
                                                else
                                                {
                                                    ecer_Certificate certUpdate = new ecer_Certificate();
                                                    certUpdate.Id = certificate.Id;
                                                    certUpdate.ecer_CertificateLevel = cert_level;
                                                    _orgService.Update(certUpdate);
                                                }

                                                if (missing_level != "" && missing_level != null)
                                                {
                                                    DateTime? effectiveDateITEFinal = null; 
                                                    DateTime? effectiveDateSNEFinal = null; 
                                                    DateTime? effectiveDate = certificate.ecer_EffectiveDate;

                                                    if (missing_level == "ITE")
                                                    {
                                                        var certifiedLevels = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                                where c.ecer_DisplayName == "Infant / Toddler Educator" &&
                                                                                c.ecer_RegistrantId == certificate.ecer_Registrantid
                                                                                select c).ToList();

                                                        if (certifiedLevels != null && certifiedLevels.Count > 0)
                                                        {
                                                            var sortedLevels = certifiedLevels.OrderBy(orig => orig.ecer_OriginalCertificationDate);
                                                            var firstLevel = sortedLevels.First();
                                                            effectiveDateITEFinal = firstLevel.ecer_OriginalCertificationDate;
                                                        }
                                                        else {
                                                            effectiveDateITEFinal = effectiveDate; 
                                                        }

                                                        ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                                        certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("3f02bf51-7be1-ee11-904c-0022486e0199"));
                                                        certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", certificate.Id);
                                                        certLevel.ecer_RegistrantId = new EntityReference("contact", certificate.ecer_Registrantid.Id);
                                                        certLevel.ecer_DisplayName = "Infant / Toddler Educator";
                                                        certLevel.ecer_OriginalCertificationDate = effectiveDateITEFinal;
                                                        var levelITE = _orgService.Create(certLevel);

                                                        Thread.Sleep(15000);

                                                        ecer_CertifiedLevel certLevelITE = new ecer_CertifiedLevel();
                                                        certLevelITE.Id = levelITE;
                                                        certLevelITE.ecer_OriginalCertificationDate = effectiveDateITEFinal;
                                                        _orgService.Update(certLevelITE);

                                                    }
                                                    else if (missing_level == "ITEREMOVE")
                                                    {
                                                        var ITELevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                               where c.ecer_DisplayName == "Infant / Toddler Educator" &&
                                                                               c.ecer_CertificateId.Id == certificate.Id
                                                                               select c).FirstOrDefault();

                                                        if (ITELevel != null)
                                                        {
                                                            _orgService.Delete("ecer_certifiedlevel", ITELevel.Id);
                                                        }
                                                    }
                                                    else if (missing_level == "SNEREMOVE")
                                                    {
                                                        var SNELevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                        where c.ecer_DisplayName == "Special Needs Educator" &&
                                                                        c.ecer_CertificateId.Id == certificate.Id
                                                                        select c).FirstOrDefault();

                                                        if (SNELevel != null)
                                                        {
                                                            _orgService.Delete("ecer_certifiedlevel", SNELevel.Id);
                                                        }
                                                    }
                                                    else if (missing_level == "ITEANDSNEREMOVE")
                                                    {
                                                        var ITELevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                        where c.ecer_DisplayName == "Infant / Toddler Educator" &&
                                                                        c.ecer_CertificateId.Id == certificate.Id
                                                                        select c).FirstOrDefault();

                                                        if (ITELevel != null)
                                                        {
                                                            _orgService.Delete("ecer_certifiedlevel", ITELevel.Id);
                                                        }

                                                        var SNELevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                        where c.ecer_DisplayName == "Special Needs Educator" &&
                                                                        c.ecer_CertificateId.Id == certificate.Id
                                                                        select c).FirstOrDefault();

                                                        if (SNELevel != null)
                                                        {
                                                            _orgService.Delete("ecer_certifiedlevel", SNELevel.Id);
                                                        }
                                                    }
                                                    else if (missing_level == "ITEREMOVESNEADD")
                                                    {
                                                        var ITELevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                        where c.ecer_DisplayName == "Infant / Toddler Educator" &&
                                                                        c.ecer_CertificateId.Id == certificate.Id
                                                                        select c).FirstOrDefault();

                                                        if (ITELevel != null)
                                                        {
                                                            _orgService.Delete("ecer_certifiedlevel", ITELevel.Id);
                                                        }

                                                        var certifiedLevels = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                               where c.ecer_DisplayName == "Special Needs Educator" &&
                                                                               c.ecer_RegistrantId == certificate.ecer_Registrantid
                                                                               select c).ToList();

                                                        if (certifiedLevels != null && certifiedLevels.Count > 0)
                                                        {
                                                            var sortedLevels = certifiedLevels.OrderBy(orig => orig.ecer_OriginalCertificationDate);
                                                            var firstLevel = sortedLevels.First();
                                                            effectiveDateSNEFinal = firstLevel.ecer_OriginalCertificationDate;
                                                        }
                                                        else
                                                        {
                                                            effectiveDateSNEFinal = effectiveDate;
                                                        }

                                                        ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                                        certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("15e95044-7be1-ee11-904c-0022486e0199"));
                                                        certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", certificate.Id);
                                                        certLevel.ecer_RegistrantId = new EntityReference("contact", certificate.ecer_Registrantid.Id);
                                                        certLevel.ecer_DisplayName = "Special Needs Educator";
                                                        certLevel.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                        var levelSNE = _orgService.Create(certLevel);

                                                        Thread.Sleep(15000);

                                                        ecer_CertifiedLevel certLevelSNE = new ecer_CertifiedLevel();
                                                        certLevelSNE.Id = levelSNE;
                                                        certLevelSNE.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                        _orgService.Update(certLevelSNE);
                                                    }
                                                    else if (missing_level == "SNEREMOVEITEADD")
                                                    {
                                                        var SNELevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                        where c.ecer_DisplayName == "Special Needs Educator" &&
                                                                        c.ecer_CertificateId.Id == certificate.Id
                                                                        select c).FirstOrDefault();

                                                        if (SNELevel != null)
                                                        {
                                                            _orgService.Delete("ecer_certifiedlevel", SNELevel.Id);
                                                        }

                                                        var ITELevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                        where c.ecer_DisplayName == "Infant / Toddler Educator" &&
                                                                        c.ecer_CertificateId.Id == certificate.Id
                                                                        select c).FirstOrDefault();

                                                        if (ITELevel != null)
                                                        {
                                                            _orgService.Delete("ecer_certifiedlevel", ITELevel.Id);
                                                        }

                                                        var certifiedLevels = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                               where c.ecer_DisplayName == "Infant / Toddler Educator" &&
                                                                               c.ecer_RegistrantId == certificate.ecer_Registrantid
                                                                               select c).ToList();

                                                        if (certifiedLevels != null && certifiedLevels.Count > 0)
                                                        {
                                                            var sortedLevels = certifiedLevels.OrderBy(orig => orig.ecer_OriginalCertificationDate);
                                                            var firstLevel = sortedLevels.First();
                                                            effectiveDateSNEFinal = firstLevel.ecer_OriginalCertificationDate;
                                                        }
                                                        else
                                                        {
                                                            effectiveDateSNEFinal = effectiveDate;
                                                        }

                                                        ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                                        certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("3f02bf51-7be1-ee11-904c-0022486e0199"));
                                                        certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", certificate.Id);
                                                        certLevel.ecer_RegistrantId = new EntityReference("contact", certificate.ecer_Registrantid.Id);
                                                        certLevel.ecer_DisplayName = "Infant / Toddler Educator";
                                                        certLevel.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                        var levelSNE = _orgService.Create(certLevel);

                                                        Thread.Sleep(15000);

                                                        ecer_CertifiedLevel certLevelSNE = new ecer_CertifiedLevel();
                                                        certLevelSNE.Id = levelSNE;
                                                        certLevelSNE.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                        _orgService.Update(certLevelSNE);
                                                    }
                                                    else if (missing_level == "1YRADDASSTREMOVE")
                                                    {
                                                        var ASSTLevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                        where c.ecer_DisplayName == "Early Childhood Educator Assistant" &&
                                                                        c.ecer_CertificateId.Id == certificate.Id
                                                                        select c).FirstOrDefault();

                                                        if (ASSTLevel != null)
                                                        {
                                                            _orgService.Delete("ecer_certifiedlevel", ASSTLevel.Id);
                                                        }

                                                        var certifiedLevels = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                               where c.ecer_DisplayName == "Early Childhood Educator" &&
                                                                               c.ecer_RegistrantId == certificate.ecer_Registrantid
                                                                               select c).ToList();

                                                        if (certifiedLevels != null && certifiedLevels.Count > 0)
                                                        {
                                                            var sortedLevels = certifiedLevels.OrderBy(orig => orig.ecer_OriginalCertificationDate);
                                                            var firstLevel = sortedLevels.First();
                                                            effectiveDateSNEFinal = firstLevel.ecer_OriginalCertificationDate;
                                                        }
                                                        else
                                                        {
                                                            effectiveDateSNEFinal = effectiveDate;
                                                        }

                                                        ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                                        certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("d093c93d-7be1-ee11-904c-0022486e0199"));
                                                        certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", certificate.Id);
                                                        certLevel.ecer_RegistrantId = new EntityReference("contact", certificate.ecer_Registrantid.Id);
                                                        certLevel.ecer_DisplayName = "Early Childhood Educator";
                                                        certLevel.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                        var levelSNE = _orgService.Create(certLevel);

                                                        Thread.Sleep(15000);

                                                        ecer_CertifiedLevel certLevelSNE = new ecer_CertifiedLevel();
                                                        certLevelSNE.Id = levelSNE;
                                                        certLevelSNE.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                        _orgService.Update(certLevelSNE);
                                                    }
                                                    else if (missing_level == "ASSTADD1YRREMOVE")
                                                    {
                                                        var ONEYRLevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                         where c.ecer_DisplayName == "Early Childhood Educator" &&
                                                                         c.ecer_CertificateId.Id == certificate.Id
                                                                         select c).FirstOrDefault();

                                                        if (ONEYRLevel != null)
                                                        {
                                                            _orgService.Delete("ecer_certifiedlevel", ONEYRLevel.Id);
                                                        }

                                                        var certifiedLevels = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                               where c.ecer_DisplayName == "Early Childhood Educator Assistant" &&
                                                                               c.ecer_RegistrantId == certificate.ecer_Registrantid
                                                                               select c).ToList();

                                                        if (certifiedLevels != null && certifiedLevels.Count > 0)
                                                        {
                                                            var sortedLevels = certifiedLevels.OrderBy(orig => orig.ecer_OriginalCertificationDate);
                                                            var firstLevel = sortedLevels.First();
                                                            effectiveDateSNEFinal = firstLevel.ecer_OriginalCertificationDate;
                                                        }
                                                        else
                                                        {
                                                            effectiveDateSNEFinal = effectiveDate;
                                                        }

                                                        ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                                        certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("d593c93d-7be1-ee11-904c-0022486e0199"));
                                                        certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", certificate.Id);
                                                        certLevel.ecer_RegistrantId = new EntityReference("contact", certificate.ecer_Registrantid.Id);
                                                        certLevel.ecer_DisplayName = "Early Childhood Educator Assistant";
                                                        certLevel.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                        var levelSNE = _orgService.Create(certLevel);

                                                        Thread.Sleep(15000);

                                                        ecer_CertifiedLevel certLevelSNE = new ecer_CertifiedLevel();
                                                        certLevelSNE.Id = levelSNE;
                                                        certLevelSNE.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                        _orgService.Update(certLevelSNE);
                                                    }
                                                    else if (missing_level == "ASSTADD5YRSNEREMOVE")
                                                    {
                                                        var FIVEYRLevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                          where c.ecer_DisplayName == "Early Childhood Educator" &&
                                                                          c.ecer_CertificateId.Id == certificate.Id
                                                                          select c).FirstOrDefault();

                                                        if (FIVEYRLevel != null)
                                                        {
                                                            _orgService.Delete("ecer_certifiedlevel", FIVEYRLevel.Id);
                                                        }

                                                        var SNELevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                           where c.ecer_DisplayName == "Special Needs Educator" &&
                                                                           c.ecer_CertificateId.Id == certificate.Id
                                                                           select c).FirstOrDefault();

                                                        if (SNELevel != null)
                                                        {
                                                            _orgService.Delete("ecer_certifiedlevel", SNELevel.Id);
                                                        }

                                                        var certifiedLevels = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                               where c.ecer_DisplayName == "Early Childhood Educator Assistant" &&
                                                                               c.ecer_RegistrantId == certificate.ecer_Registrantid
                                                                               select c).ToList();

                                                        if (certifiedLevels != null && certifiedLevels.Count > 0)
                                                        {
                                                            var sortedLevels = certifiedLevels.OrderBy(orig => orig.ecer_OriginalCertificationDate);
                                                            var firstLevel = sortedLevels.First();
                                                            effectiveDateSNEFinal = firstLevel.ecer_OriginalCertificationDate;
                                                        }
                                                        else
                                                        {
                                                            effectiveDateSNEFinal = effectiveDate;
                                                        }

                                                        ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                                        certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("d593c93d-7be1-ee11-904c-0022486e0199"));
                                                        certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", certificate.Id);
                                                        certLevel.ecer_RegistrantId = new EntityReference("contact", certificate.ecer_Registrantid.Id);
                                                        certLevel.ecer_DisplayName = "Early Childhood Educator Assistant";
                                                        certLevel.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                        var levelSNE = _orgService.Create(certLevel);

                                                        Thread.Sleep(15000);

                                                        ecer_CertifiedLevel certLevelSNE = new ecer_CertifiedLevel();
                                                        certLevelSNE.Id = levelSNE;
                                                        certLevelSNE.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                        _orgService.Update(certLevelSNE);
                                                    }
                                                else if (missing_level == "ASSTADD5YRREMOVE")
                                                {
                                                    var FIVEYRLevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                       where c.ecer_DisplayName == "Early Childhood Educator" &&
                                                                       c.ecer_CertificateId.Id == certificate.Id
                                                                       select c).FirstOrDefault();

                                                    if (FIVEYRLevel != null)
                                                    {
                                                        _orgService.Delete("ecer_certifiedlevel", FIVEYRLevel.Id);
                                                    }

                                                    var certifiedLevels = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                           where c.ecer_DisplayName == "Early Childhood Educator Assistant" &&
                                                                           c.ecer_RegistrantId == certificate.ecer_Registrantid
                                                                           select c).ToList();

                                                    if (certifiedLevels != null && certifiedLevels.Count > 0)
                                                    {
                                                        var sortedLevels = certifiedLevels.OrderBy(orig => orig.ecer_OriginalCertificationDate);
                                                        var firstLevel = sortedLevels.First();
                                                        effectiveDateSNEFinal = firstLevel.ecer_OriginalCertificationDate;
                                                    }
                                                    else
                                                    {
                                                        effectiveDateSNEFinal = effectiveDate;
                                                    }

                                                    ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                                    certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("d593c93d-7be1-ee11-904c-0022486e0199"));
                                                    certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", certificate.Id);
                                                    certLevel.ecer_RegistrantId = new EntityReference("contact", certificate.ecer_Registrantid.Id);
                                                    certLevel.ecer_DisplayName = "Early Childhood Educator Assistant";
                                                    certLevel.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                    var levelSNE = _orgService.Create(certLevel);

                                                    Thread.Sleep(15000);

                                                    ecer_CertifiedLevel certLevelSNE = new ecer_CertifiedLevel();
                                                    certLevelSNE.Id = levelSNE;
                                                    certLevelSNE.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                    _orgService.Update(certLevelSNE);
                                                }
                                                else if (missing_level == "ASSTADD5YRITESNEREMOVE")
                                                {
                                                    var FIVEYRLevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                       where c.ecer_DisplayName == "Early Childhood Educator" &&
                                                                       c.ecer_CertificateId.Id == certificate.Id
                                                                       select c).FirstOrDefault();

                                                    if (FIVEYRLevel != null)
                                                    {
                                                        _orgService.Delete("ecer_certifiedlevel", FIVEYRLevel.Id);
                                                    }

                                                    var SNELevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                    where c.ecer_DisplayName == "Special Needs Educator" &&
                                                                    c.ecer_CertificateId.Id == certificate.Id
                                                                    select c).FirstOrDefault();

                                                    if (SNELevel != null)
                                                    {
                                                        _orgService.Delete("ecer_certifiedlevel", SNELevel.Id);
                                                    }

                                                    var ITELevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                    where c.ecer_DisplayName == "Infant / Toddler Educator" &&
                                                                    c.ecer_CertificateId.Id == certificate.Id
                                                                    select c).FirstOrDefault();

                                                    if (ITELevel != null)
                                                    {
                                                        _orgService.Delete("ecer_certifiedlevel", ITELevel.Id);
                                                    }

                                                    var certifiedLevels = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                           where c.ecer_DisplayName == "Early Childhood Educator Assistant" &&
                                                                           c.ecer_RegistrantId == certificate.ecer_Registrantid
                                                                           select c).ToList();

                                                    if (certifiedLevels != null && certifiedLevels.Count > 0)
                                                    {
                                                        var sortedLevels = certifiedLevels.OrderBy(orig => orig.ecer_OriginalCertificationDate);
                                                        var firstLevel = sortedLevels.First();
                                                        effectiveDateSNEFinal = firstLevel.ecer_OriginalCertificationDate;
                                                    }
                                                    else
                                                    {
                                                        effectiveDateSNEFinal = effectiveDate;
                                                    }

                                                    ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                                    certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("d593c93d-7be1-ee11-904c-0022486e0199"));
                                                    certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", certificate.Id);
                                                    certLevel.ecer_RegistrantId = new EntityReference("contact", certificate.ecer_Registrantid.Id);
                                                    certLevel.ecer_DisplayName = "Early Childhood Educator Assistant";
                                                    certLevel.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                    var levelSNE = _orgService.Create(certLevel);

                                                    Thread.Sleep(15000);

                                                    ecer_CertifiedLevel certLevelSNE = new ecer_CertifiedLevel();
                                                    certLevelSNE.Id = levelSNE;
                                                    certLevelSNE.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                    _orgService.Update(certLevelSNE);
                                                }
                                                else if (missing_level == "1YRADD5YRSNEREMOVE")
                                                {
                                                    var FIVEYRLevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                        where c.ecer_DisplayName == "Early Childhood Educator" &&
                                                                        c.ecer_CertificateId.Id == certificate.Id
                                                                        select c).FirstOrDefault();

                                                    if (FIVEYRLevel != null)
                                                    {
                                                        _orgService.Delete("ecer_certifiedlevel", FIVEYRLevel.Id);
                                                    }

                                                    var SNELevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                    where c.ecer_DisplayName == "Special Needs Educator" &&
                                                                    c.ecer_CertificateId.Id == certificate.Id
                                                                    select c).FirstOrDefault();

                                                    if (SNELevel != null)
                                                    {
                                                        _orgService.Delete("ecer_certifiedlevel", SNELevel.Id);
                                                    }

                                                    var certifiedLevels = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                            where c.ecer_DisplayName == "Early Childhood Educator" &&
                                                                            c.ecer_RegistrantId == certificate.ecer_Registrantid
                                                                            select c).ToList();

                                                    if (certifiedLevels != null && certifiedLevels.Count > 0)
                                                    {
                                                        var sortedLevels = certifiedLevels.OrderBy(orig => orig.ecer_OriginalCertificationDate);
                                                        var firstLevel = sortedLevels.First();
                                                        effectiveDateSNEFinal = firstLevel.ecer_OriginalCertificationDate;
                                                    }
                                                    else
                                                    {
                                                        effectiveDateSNEFinal = effectiveDate;
                                                    }

                                                    ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                                    certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("d093c93d-7be1-ee11-904c-0022486e0199"));
                                                    certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", certificate.Id);
                                                    certLevel.ecer_RegistrantId = new EntityReference("contact", certificate.ecer_Registrantid.Id);
                                                    certLevel.ecer_DisplayName = "Early Childhood Educator";
                                                    certLevel.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                    var levelSNE = _orgService.Create(certLevel);

                                                    Thread.Sleep(15000);

                                                    ecer_CertifiedLevel certLevelSNE = new ecer_CertifiedLevel();
                                                    certLevelSNE.Id = levelSNE;
                                                    certLevelSNE.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                    _orgService.Update(certLevelSNE);
                                                }
                                                else if (missing_level == "1YRADD5YRITESNEREMOVE")
                                                {
                                                    var FIVEYRLevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                       where c.ecer_DisplayName == "Early Childhood Educator" &&
                                                                       c.ecer_CertificateId.Id == certificate.Id
                                                                       select c).FirstOrDefault();

                                                    if (FIVEYRLevel != null)
                                                    {
                                                        _orgService.Delete("ecer_certifiedlevel", FIVEYRLevel.Id);
                                                    }

                                                    var SNELevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                    where c.ecer_DisplayName == "Special Needs Educator" &&
                                                                    c.ecer_CertificateId.Id == certificate.Id
                                                                    select c).FirstOrDefault();

                                                    if (SNELevel != null)
                                                    {
                                                        _orgService.Delete("ecer_certifiedlevel", SNELevel.Id);
                                                    }

                                                    var ITELevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                    where c.ecer_DisplayName == "Infant / Toddler Educator" &&
                                                                    c.ecer_CertificateId.Id == certificate.Id
                                                                    select c).FirstOrDefault();

                                                    if (ITELevel != null)
                                                    {
                                                        _orgService.Delete("ecer_certifiedlevel", ITELevel.Id);
                                                    }

                                                    var certifiedLevels = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                           where c.ecer_DisplayName == "Early Childhood Educator" &&
                                                                           c.ecer_RegistrantId == certificate.ecer_Registrantid
                                                                           select c).ToList();

                                                    if (certifiedLevels != null && certifiedLevels.Count > 0)
                                                    {
                                                        var sortedLevels = certifiedLevels.OrderBy(orig => orig.ecer_OriginalCertificationDate);
                                                        var firstLevel = sortedLevels.First();
                                                        effectiveDateSNEFinal = firstLevel.ecer_OriginalCertificationDate;
                                                    }
                                                    else
                                                    {
                                                        effectiveDateSNEFinal = effectiveDate;
                                                    }

                                                    ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                                    certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("d093c93d-7be1-ee11-904c-0022486e0199"));
                                                    certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", certificate.Id);
                                                    certLevel.ecer_RegistrantId = new EntityReference("contact", certificate.ecer_Registrantid.Id);
                                                    certLevel.ecer_DisplayName = "Early Childhood Educator";
                                                    certLevel.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                    var levelSNE = _orgService.Create(certLevel);

                                                    Thread.Sleep(15000);

                                                    ecer_CertifiedLevel certLevelSNE = new ecer_CertifiedLevel();
                                                    certLevelSNE.Id = levelSNE;
                                                    certLevelSNE.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                    _orgService.Update(certLevelSNE);
                                                }
                                                else if (missing_level == "1YRADD5YRREMOVE")
                                                {
                                                    var FIVEYRLevel = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                       where c.ecer_DisplayName == "Early Childhood Educator" &&
                                                                       c.ecer_CertificateId.Id == certificate.Id
                                                                       select c).FirstOrDefault();

                                                    if (FIVEYRLevel != null)
                                                    {
                                                        _orgService.Delete("ecer_certifiedlevel", FIVEYRLevel.Id);
                                                    }

                                                    var certifiedLevels = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                           where c.ecer_DisplayName == "Early Childhood Educator" &&
                                                                           c.ecer_RegistrantId == certificate.ecer_Registrantid
                                                                           select c).ToList();

                                                    if (certifiedLevels != null && certifiedLevels.Count > 0)
                                                    {
                                                        var sortedLevels = certifiedLevels.OrderBy(orig => orig.ecer_OriginalCertificationDate);
                                                        var firstLevel = sortedLevels.First();
                                                        effectiveDateSNEFinal = firstLevel.ecer_OriginalCertificationDate;
                                                    }
                                                    else
                                                    {
                                                        effectiveDateSNEFinal = effectiveDate;
                                                    }

                                                    ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                                    certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("d093c93d-7be1-ee11-904c-0022486e0199"));
                                                    certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", certificate.Id);
                                                    certLevel.ecer_RegistrantId = new EntityReference("contact", certificate.ecer_Registrantid.Id);
                                                    certLevel.ecer_DisplayName = "Early Childhood Educator";
                                                    certLevel.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                    var levelSNE = _orgService.Create(certLevel);

                                                    Thread.Sleep(15000);

                                                    ecer_CertifiedLevel certLevelSNE = new ecer_CertifiedLevel();
                                                    certLevelSNE.Id = levelSNE;
                                                    certLevelSNE.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                    _orgService.Update(certLevelSNE);
                                                }
                                                else if (missing_level == "SNE")
                                                    {
                                                        var certifiedLevels = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                                where c.ecer_DisplayName == "Special Needs Educator" &&
                                                                                c.ecer_RegistrantId == certificate.ecer_Registrantid
                                                                                select c).ToList();

                                                        if (certifiedLevels != null && certifiedLevels.Count > 0)
                                                        {
                                                            var sortedLevels = certifiedLevels.OrderBy(orig => orig.ecer_OriginalCertificationDate);
                                                            var firstLevel = sortedLevels.First();
                                                            effectiveDateSNEFinal = firstLevel.ecer_OriginalCertificationDate;
                                                        }
                                                        else
                                                        {
                                                            effectiveDateSNEFinal = effectiveDate;
                                                        }

                                                        ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                                        certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("15e95044-7be1-ee11-904c-0022486e0199"));
                                                        certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", certificate.Id);
                                                        certLevel.ecer_RegistrantId = new EntityReference("contact", certificate.ecer_Registrantid.Id);
                                                        certLevel.ecer_DisplayName = "Special Needs Educator";
                                                        certLevel.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                        var levelSNE = _orgService.Create(certLevel);

                                                        Thread.Sleep(15000);

                                                        ecer_CertifiedLevel certLevelSNE = new ecer_CertifiedLevel();
                                                        certLevelSNE.Id = levelSNE;
                                                        certLevelSNE.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                        _orgService.Update(certLevelSNE);

                                                    }
                                                    else if (missing_level == "ITE SNE")
                                                    {
                                                        // SNE
                                                        var certifiedLevels = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                                where c.ecer_DisplayName == "Special Needs Educator" &&
                                                                                c.ecer_RegistrantId == certificate.ecer_Registrantid
                                                                                select c).ToList();

                                                        if (certifiedLevels != null && certifiedLevels.Count > 0)
                                                        {
                                                            var sortedLevels = certifiedLevels.OrderBy(orig => orig.ecer_OriginalCertificationDate);
                                                            var firstLevel = sortedLevels.First();
                                                            effectiveDateSNEFinal = firstLevel.ecer_OriginalCertificationDate;
                                                        }
                                                        else
                                                        {
                                                            effectiveDateSNEFinal = effectiveDate;
                                                        }

                                                        ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                                        certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("15e95044-7be1-ee11-904c-0022486e0199"));
                                                        certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", certificate.Id);
                                                        certLevel.ecer_RegistrantId = new EntityReference("contact", certificate.ecer_Registrantid.Id);
                                                        certLevel.ecer_DisplayName = "Special Needs Educator";
                                                        certLevel.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                        var levelSNE = _orgService.Create(certLevel);

                                                        Thread.Sleep(15000);

                                                        ecer_CertifiedLevel certLevelSNE = new ecer_CertifiedLevel();
                                                        certLevelSNE.Id = levelSNE;
                                                        certLevelSNE.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                        _orgService.Update(certLevelSNE);


                                                        // ITE
                                                        var certifiedLevels2 = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                                where c.ecer_DisplayName == "Infant / Toddler Educator" &&
                                                                                c.ecer_RegistrantId == certificate.ecer_Registrantid
                                                                                select c).ToList();

                                                        if (certifiedLevels2 != null && certifiedLevels2.Count > 0)
                                                        {
                                                            var sortedLevels2 = certifiedLevels2.OrderBy(orig => orig.ecer_OriginalCertificationDate);
                                                            var firstLevel2 = sortedLevels2.First();
                                                            effectiveDateITEFinal = firstLevel2.ecer_OriginalCertificationDate;
                                                        }
                                                        else
                                                        {
                                                            effectiveDateITEFinal = effectiveDate;
                                                        }

                                                        ecer_CertifiedLevel certLevel2 = new ecer_CertifiedLevel();
                                                        certLevel2.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("3f02bf51-7be1-ee11-904c-0022486e0199"));
                                                        certLevel2.ecer_CertificateId = new EntityReference("ecer_certificate", certificate.Id);
                                                        certLevel2.ecer_RegistrantId = new EntityReference("contact", certificate.ecer_Registrantid.Id);
                                                        certLevel2.ecer_DisplayName = "Infant / Toddler Educator";
                                                        certLevel2.ecer_OriginalCertificationDate = effectiveDateITEFinal;
                                                        var levelITE = _orgService.Create(certLevel2);

                                                        Thread.Sleep(15000);

                                                        ecer_CertifiedLevel certLevelITE = new ecer_CertifiedLevel();
                                                        certLevelITE.Id = levelITE;
                                                        certLevelITE.ecer_OriginalCertificationDate = effectiveDateITEFinal;
                                                        _orgService.Update(certLevelITE);
                                                    }
                                                }

                                            }
                                        }
                                    }
                                    else
                                    {
                                        client = (from c in orgContext.CreateQuery<Contact>()
                                                  where c.ecer_ClientID == container.ecer_legacyclientid
                                                  select c).FirstOrDefault();

                                        if (client != null)
                                        {
                                            certificate2 = (from c in orgContext.CreateQuery<ecer_Certificate>()
                                                            where c.ecer_Registrantid.Id == client.Id &&
                                                            (c.ecer_EffectiveDate == Convert.ToDateTime(container.effective_date) ||
                                                            c.ecer_EffectiveDate == Convert.ToDateTime(container.effective_date).AddDays(1) ||
                                                            c.ecer_EffectiveDate == Convert.ToDateTime(container.effective_date).AddDays(-1))
                                                            select c).FirstOrDefault();

                                            if (certificate2 != null)
                                            {
                                                string cert_level = "";
                                                string missing_level = "";

                                                //if (container.educ_lvl_oracle == "ECE 5 YR")
                                                //{
                                                //    cert_level = "ECE 5 YR";
                                                //}
                                                //else if (container.educ_lvl_oracle == "ITE")
                                                //{
                                                //    cert_level = "ECE 5 YR ITE";
                                                //}
                                                //else if (container.educ_lvl_oracle == "SNE")
                                                //{
                                                //    certificate3 = (from c in orgContext.CreateQuery<ecer_Certificate>()
                                                //                    where c.ecer_Registrantid.Id == client.Id &&
                                                //                    (c.ecer_EffectiveDate == Convert.ToDateTime(container.effective_date) ||
                                                //                    c.ecer_EffectiveDate == Convert.ToDateTime(container.effective_date).AddDays(1) ||
                                                //                    c.ecer_EffectiveDate == Convert.ToDateTime(container.effective_date).AddDays(-1))
                                                //                    select c).FirstOrDefault();

                                                //    if (certificate3.ecer_CertificateLevel.Contains("ECE 5 YR ITE SNE"))
                                                //    {
                                                //        cert_level = "ECE 5 YR SNE";
                                                //    }
                                                //    else if (certificate3.ecer_CertificateLevel.Contains("ITE"))
                                                //    {
                                                //        cert_level = "ECE 5 YR ITE SNE";
                                                //    }
                                                //    else
                                                //    {
                                                //        cert_level = "ECE 5 YR SNE";
                                                //    }
                                                //}
                                                //else if (container.educ_lvl_oracle == "ECE 1 YR")
                                                //{
                                                //    cert_level = "ECE 1 YR";
                                                //}
                                                //else if (container.educ_lvl_oracle == "ASST")
                                                //{
                                                //    cert_level = "ASST";
                                                //}
                                                //if (container.educ_lvl_oracle == "ECE 5 YR ITE" && container.cert_level_dynamics == "ECE 5 YR ITE SNE")
                                                //{
                                                //    cert_level = "ECE 5 YR ITE";
                                                //}
                                                if (container.educ_lvl_oracle == "ECE 5 YR ITE SNE" && container.cert_level_dynamics == "ECE 5 YR ITE")
                                                {
                                                    cert_level = "ECE 5 YR ITE SNE";
                                                    missing_level = "SNE";
                                                }
                                                else if (container.educ_lvl_oracle == "ECE 5 YR ITE SNE" && container.cert_level_dynamics == "ECE 5 YR SNE")
                                                {
                                                    cert_level = "ECE 5 YR ITE SNE";
                                                    missing_level = "ITE";
                                                }
                                                else if (container.educ_lvl_oracle == "ECE 5 YR ITE SNE" && container.cert_level_dynamics == "ECE 5 YR")
                                                {
                                                    cert_level = "ECE 5 YR ITE SNE";
                                                    missing_level = "ITE SNE";
                                                }
                                                else if (container.educ_lvl_oracle == "ECE 5 YR SNE" && container.cert_level_dynamics == "ECE 5 YR")
                                                {
                                                    cert_level = "ECE 5 YR SNE";
                                                    missing_level = "SNE";
                                                }
                                                else if (container.educ_lvl_oracle == "ECE 5 YR ITE" && container.cert_level_dynamics == "ECE 5 YR")
                                                {
                                                    cert_level = "ECE 5 YR ITE";
                                                    missing_level = "ITE";
                                                }

                                                if (cert_level != "")
                                                {
                                                    ecer_Certificate certUpdate = new ecer_Certificate();
                                                    certUpdate.Id = certificate2.Id;
                                                    certUpdate.ecer_CertificateLevel = cert_level;
                                                    _orgService.Update(certUpdate);
                                                }

                                                if (missing_level != "" && missing_level != null)
                                                {
                                                    DateTime? effectiveDateITEFinal = null;
                                                    DateTime? effectiveDateSNEFinal = null;
                                                    DateTime? effectiveDate = certificate2.ecer_EffectiveDate;

                                                    if (missing_level == "ITE")
                                                    {
                                                        var certifiedLevels = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                               where c.ecer_DisplayName == "Infant / Toddler Educator" &&
                                                                               c.ecer_RegistrantId == certificate2.ecer_Registrantid
                                                                               select c).ToList();

                                                        if (certifiedLevels != null && certifiedLevels.Count > 0)
                                                        {
                                                            var sortedLevels = certifiedLevels.OrderBy(orig => orig.ecer_OriginalCertificationDate);
                                                            var firstLevel = sortedLevels.First();
                                                            effectiveDateITEFinal = firstLevel.ecer_OriginalCertificationDate;
                                                        }
                                                        else
                                                        {
                                                            effectiveDateITEFinal = effectiveDate;
                                                        }

                                                        ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                                        certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("3f02bf51-7be1-ee11-904c-0022486e0199"));
                                                        certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", certificate2.Id);
                                                        certLevel.ecer_RegistrantId = new EntityReference("contact", certificate2.ecer_Registrantid.Id);
                                                        certLevel.ecer_DisplayName = "Infant / Toddler Educator";
                                                        certLevel.ecer_OriginalCertificationDate = effectiveDateITEFinal;
                                                        var levelITE = _orgService.Create(certLevel);

                                                        Thread.Sleep(15000);

                                                        ecer_CertifiedLevel certLevelITE = new ecer_CertifiedLevel();
                                                        certLevelITE.Id = levelITE;
                                                        certLevelITE.ecer_OriginalCertificationDate = effectiveDateITEFinal;
                                                        _orgService.Update(certLevelITE);
                                                    }
                                                    else if (missing_level == "SNE")
                                                    {
                                                        var certifiedLevels = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                               where c.ecer_DisplayName == "Special Needs Educator" &&
                                                                               c.ecer_RegistrantId == certificate2.ecer_Registrantid
                                                                               select c).ToList();

                                                        if (certifiedLevels != null && certifiedLevels.Count > 0)
                                                        {
                                                            var sortedLevels = certifiedLevels.OrderBy(orig => orig.ecer_OriginalCertificationDate);
                                                            var firstLevel = sortedLevels.First();
                                                            effectiveDateSNEFinal = firstLevel.ecer_OriginalCertificationDate;
                                                        }
                                                        else
                                                        {
                                                            effectiveDateSNEFinal = effectiveDate;
                                                        }

                                                        ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                                        certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("15e95044-7be1-ee11-904c-0022486e0199"));
                                                        certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", certificate2.Id);
                                                        certLevel.ecer_RegistrantId = new EntityReference("contact", certificate2.ecer_Registrantid.Id);
                                                        certLevel.ecer_DisplayName = "Special Needs Educator";
                                                        certLevel.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                        var levelSNE = _orgService.Create(certLevel);

                                                        Thread.Sleep(15000);

                                                        ecer_CertifiedLevel certLevelSNE = new ecer_CertifiedLevel();
                                                        certLevelSNE.Id = levelSNE;
                                                        certLevelSNE.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                        _orgService.Update(certLevelSNE);
                                                    }
                                                    else if (missing_level == "ITE SNE")
                                                    {
                                                        // SNE 
                                                        var certifiedLevels = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                               where c.ecer_DisplayName == "Special Needs Educator" &&
                                                                               c.ecer_RegistrantId == certificate2.ecer_Registrantid
                                                                               select c).ToList();

                                                        if (certifiedLevels != null && certifiedLevels.Count > 0)
                                                        {
                                                            var sortedLevels = certifiedLevels.OrderBy(orig => orig.ecer_OriginalCertificationDate);
                                                            var firstLevel = sortedLevels.First();
                                                            effectiveDateSNEFinal = firstLevel.ecer_OriginalCertificationDate;
                                                        }
                                                        else
                                                        {
                                                            effectiveDateSNEFinal = effectiveDate;
                                                        }

                                                        ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                                        certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("15e95044-7be1-ee11-904c-0022486e0199"));
                                                        certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", certificate.Id);
                                                        certLevel.ecer_RegistrantId = new EntityReference("contact", certificate.ecer_Registrantid.Id);
                                                        certLevel.ecer_DisplayName = "Special Needs Educator";
                                                        certLevel.ecer_OriginalCertificationDate = effectiveDate;
                                                        var levelSNE = _orgService.Create(certLevel);

                                                        Thread.Sleep(15000);

                                                        ecer_CertifiedLevel certLevelSNE = new ecer_CertifiedLevel();
                                                        certLevelSNE.Id = levelSNE;
                                                        certLevelSNE.ecer_OriginalCertificationDate = effectiveDateSNEFinal;
                                                        _orgService.Update(certLevelSNE);

                                                        // ITE
                                                        var certifiedLevels2 = (from c in orgContext.CreateQuery<ecer_CertifiedLevel>()
                                                                                where c.ecer_DisplayName == "Infant / Toddler Educator" &&
                                                                                c.ecer_RegistrantId == certificate2.ecer_Registrantid
                                                                                select c).ToList();

                                                        if (certifiedLevels2 != null && certifiedLevels2.Count > 0)
                                                        {
                                                            var sortedLevels2 = certifiedLevels2.OrderBy(orig => orig.ecer_OriginalCertificationDate);
                                                            var firstLevel2 = sortedLevels2.First();
                                                            effectiveDateITEFinal = firstLevel2.ecer_OriginalCertificationDate;
                                                        }
                                                        else
                                                        {
                                                            effectiveDateITEFinal = effectiveDate;
                                                        }

                                                        ecer_CertifiedLevel certLevel2 = new ecer_CertifiedLevel();
                                                        certLevel2.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("3f02bf51-7be1-ee11-904c-0022486e0199"));
                                                        certLevel2.ecer_CertificateId = new EntityReference("ecer_certificate", certificate.Id);
                                                        certLevel2.ecer_RegistrantId = new EntityReference("contact", certificate.ecer_Registrantid.Id);
                                                        certLevel2.ecer_DisplayName = "Infant / Toddler Educator";
                                                        certLevel2.ecer_OriginalCertificationDate = effectiveDate;
                                                        var levelITE = _orgService.Create(certLevel2);

                                                        Thread.Sleep(15000);

                                                        ecer_CertifiedLevel certLevelITE = new ecer_CertifiedLevel();
                                                        certLevelITE.Id = levelITE;
                                                        certLevelITE.ecer_OriginalCertificationDate = effectiveDateITEFinal;
                                                        _orgService.Update(certLevelITE);
                                                    }
                                                }
                                            }
                                        }
                                    }
                               // }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    // Handle the exception.
                    throw;
                }
            }
        }


        public void CreateMissingCertifiedLevels(OrganizationServiceContext orgContext, IOrganizationService _orgService)
        {
            //var certificates = (from c in orgContext.CreateQuery<ecer_Certificate>()
            //                        // where c.ecer_CertificateNumber == "56967"
            //                        //join certifiedLevel in orgContext.CreateQuery<ecer_CertifiedLevel>() 
            //                        //on c.Id equals certifiedLevel.ecer_CertificateId.Id into gj
            //                        //from subgroup in gj.DefaultIfEmpty()
            //                        //where gj.Count() == 0
            //                    where c.new_legacycheck == false ||
            //                    c.new_legacycheck == null
            //                    select c).ToList().GroupBy(contact => contact.ecer_Registrantid.Id);


            string fetchquery = @"<fetch version=""1.0"" output-format=""xml-platform"" mapping=""logical"" distinct=""true"">
                                      <entity name=""ecer_certificate"">
                                        <attribute name=""ecer_certificateid"" />
                                        <attribute name=""createdon"" />
                                        <attribute name=""ecer_certificatenumber"" />
                                        <attribute name=""ecer_registrantid"" />
                                        <attribute name=""ecer_effectivedate"" />
                                        <attribute name=""ecer_expirydate"" />
                                        <attribute name=""modifiedon"" />
                                        <attribute name=""ecer_certificatelevel"" />
                                        <order attribute=""ecer_certificatenumber"" descending=""true"" />
                                        <order attribute=""ecer_effectivedate"" descending=""false"" />
                                        <filter type=""and"">
                                          <condition attribute=""ecer_certificatenumber"" operator=""eq"" value=""19178"" />
                                        </filter>
                                        <link-entity name=""ecer_certifiedlevel"" from=""ecer_certificateid"" to=""ecer_certificateid"" link-type=""outer"" alias=""aa"" />
                                        <filter type=""and"">
                                          <condition entityname=""aa"" attribute=""ecer_certificateid"" operator=""null"" />
                                        </filter>
                                      </entity>
                                    </fetch>";

            EntityCollection certificates = _orgService.RetrieveMultiple(new FetchExpression(fetchquery));

            var certGroupAll = certificates.Entities.GroupBy(contact => contact.Attributes["ecer_registrantid"]);



            foreach (var certGroup in certGroupAll)
            {
                if (certGroup != null) {

                    var sortedCerts = certGroup.OrderBy(effectiveDate => effectiveDate.Attributes["ecer_effectivedate"]);

                    DateTime? asstDate = null;
                    DateTime? oneYearDate = null;
                    DateTime? fiveYearDate = null;
                    DateTime? iteDate = null;
                    DateTime? sneDate = null;

                    foreach (var cert in sortedCerts)
                    {
                        if (cert.Contains("ecer_effectivedate") && cert.Contains("ecer_registrantid") && cert.Contains("ecer_certificatelevel")) { 
                        if (cert.Attributes["ecer_effectivedate"] != null && cert.Attributes["ecer_registrantid"] != null && cert.Attributes["ecer_certificatelevel"] != null)
                        {
                            if (cert.Attributes["ecer_certificatelevel"].ToString().Contains("ASST"))
                            {
                                if (asstDate == null)
                                {
                                    asstDate = Convert.ToDateTime(cert.Attributes["ecer_effectivedate"]);
                                }

                                ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("d593c93d-7be1-ee11-904c-0022486e0199"));
                                certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", cert.Id);
                                certLevel.ecer_RegistrantId = new EntityReference("contact", cert.GetAttributeValue<EntityReference>("ecer_registrantid").Id);
                                certLevel.ecer_DisplayName = "Assistant";
                                certLevel.ecer_OriginalCertificationDate = asstDate;
                                _orgService.Create(certLevel);
                            }

                            if (cert.Attributes["ecer_certificatelevel"].ToString().Contains("ECE 1 YR"))
                            {
                                if (oneYearDate == null)
                                {
                                    oneYearDate = Convert.ToDateTime(cert.Attributes["ecer_effectivedate"]);
                                }

                                ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("d093c93d-7be1-ee11-904c-0022486e0199"));
                                certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", cert.Id);
                                certLevel.ecer_RegistrantId = new EntityReference("contact", cert.GetAttributeValue<EntityReference>("ecer_registrantid").Id);
                                certLevel.ecer_DisplayName = "Early Childhood Educator";
                                certLevel.ecer_OriginalCertificationDate = oneYearDate;
                                _orgService.Create(certLevel);
                            }

                            if (cert.Attributes["ecer_certificatelevel"].ToString().Contains("ECE 5 YR"))
                            {
                                if (fiveYearDate == null)
                                {
                                    fiveYearDate = Convert.ToDateTime(cert.Attributes["ecer_effectivedate"]);
                                }

                                ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("6c5424eb-9673-ee11-8179-000d3af4fa73"));
                                certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", cert.Id);
                                certLevel.ecer_RegistrantId = new EntityReference("contact", cert.GetAttributeValue<EntityReference>("ecer_registrantid").Id);
                                certLevel.ecer_DisplayName = "Early Childhood Educator";
                                certLevel.ecer_OriginalCertificationDate = fiveYearDate;
                                _orgService.Create(certLevel);
                            }

                            if (cert.Attributes["ecer_certificatelevel"].ToString().Contains("ITE"))
                            {
                                if (iteDate == null)
                                {
                                    iteDate = Convert.ToDateTime(cert.Attributes["ecer_effectivedate"]);
                                }

                                ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("3f02bf51-7be1-ee11-904c-0022486e0199"));
                                certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", cert.Id);
                                certLevel.ecer_RegistrantId = new EntityReference("contact", cert.GetAttributeValue<EntityReference>("ecer_registrantid").Id);
                                certLevel.ecer_DisplayName = "Infant / Toddler Educator";
                                certLevel.ecer_OriginalCertificationDate = iteDate;
                                _orgService.Create(certLevel);
                            }

                            if (cert.Attributes["ecer_certificatelevel"].ToString().Contains("SNE"))
                            {
                                if (sneDate == null)
                                {
                                    sneDate = Convert.ToDateTime(cert.Attributes["ecer_effectivedate"]);
                                }

                                ecer_CertifiedLevel certLevel = new ecer_CertifiedLevel();
                                certLevel.ecer_CertificateTypeId = new EntityReference("ecer_certificatetype", new Guid("15e95044-7be1-ee11-904c-0022486e0199"));
                                certLevel.ecer_CertificateId = new EntityReference("ecer_certificate", cert.Id);
                                certLevel.ecer_RegistrantId = new EntityReference("contact", cert.GetAttributeValue<EntityReference>("ecer_registrantid").Id);
                                certLevel.ecer_DisplayName = "Special Needs Educator";
                                certLevel.ecer_OriginalCertificationDate = sneDate;
                                _orgService.Create(certLevel);
                            }

                            ecer_Certificate certUpdate = new ecer_Certificate();
                            certUpdate.Id = cert.Id;
                            certUpdate.new_legacycheck = true;
                            _orgService.Update(certUpdate);
                        }
                        }
                    }
                }
            }
        }

        //public void SetEducationOriginOnApplications(OrganizationServiceContext orgContext, IOrganizationService _orgService)
        //{
        //    DateTime newdate = new DateTime(2007, 09, 09);


        //    var applications = (from c in orgContext.CreateQuery<ecer_Application>()
        //                        where c.ecer_Applicantid != null
        //                        select c).ToList().OrderByDescending(o => o.CreatedOn);

        //    foreach (var app in applications)
        //    {
        //        bool? originInBC = null;
        //        bool? originOutsideBC = null;
        //        bool? recognized = null; 

        //        var educationTranscripts = (from c in orgContext.CreateQuery<ecer_Transcript>()
        //                                    where c.ecer_Applicantid == app.ecer_Applicantid &&
        //                                    c.ecer_StartDate != null &&
        //                                    c.ecer_EndDate != null
        //                                    select c).ToList();

        //        foreach (var eduTranscript in educationTranscripts)
        //        {
        //            if (eduTranscript.ecer_EndDate < app.CreatedOn) {
        //                if (eduTranscript.ecer_legacytraininginstituteid != null && eduTranscript.ecer_legacytraininginstituteid != 2021 && eduTranscript.ecer_legacytraininginstituteid != 1001) {
        //                    originInBC = true;
        //                    recognized = true; 
        //                }
        //                else if (eduTranscript.ecer_legacytraininginstituteid == 2021 || eduTranscript.ecer_legacytraininginstituteid == 1001)
        //                {
        //                    originOutsideBC = true;
        //                    recognized = true;
        //                }
        //                else if (eduTranscript.ecer_legacytraininginstituteid == null)
        //                {
        //                    originOutsideBC = true;
        //                    recognized = false;
        //                }
        //            }
        //        }

        //        if (originOutsideBC == true && recognized == true) {
        //            ecer_Application appUpdate = new ecer_Application();
        //            appUpdate.Id = app.Id;
        //            appUpdate.ecer_EducationOrigin = new OptionSetValue(621870001); 
        //            appUpdate.ecer_EducationRecognition = new OptionSetValue(621870000);
        //            _orgService.Update(appUpdate);
        //        }
        //        else if (originOutsideBC == true && recognized == false)
        //        {
        //            ecer_Application appUpdate = new ecer_Application();
        //            appUpdate.Id = app.Id;
        //            appUpdate.ecer_EducationOrigin = new OptionSetValue(621870001);
        //            appUpdate.ecer_EducationRecognition = new OptionSetValue(621870001);
        //            _orgService.Update(appUpdate);
        //        }
        //        else if ((originOutsideBC == null || originOutsideBC == false) && originInBC == true && recognized == false)
        //        {
        //            ecer_Application appUpdate = new ecer_Application();
        //            appUpdate.Id = app.Id;
        //            appUpdate.ecer_EducationOrigin = new OptionSetValue(621870001);
        //            appUpdate.ecer_EducationRecognition = new OptionSetValue(621870001);
        //            _orgService.Update(appUpdate);
        //        }




        //        if (cert.ecer_legacyexpirydate != null)
        //        {
        //            ecer_Certificate certUpdate = new ecer_Certificate();
        //            certUpdate.Id = cert.Id;
        //            certUpdate.ecer_ExpiryDate = cert.ecer_legacyexpirydate;
        //            _orgService.Update(certUpdate);
        //        }
        //    }
        //}
    }
}
