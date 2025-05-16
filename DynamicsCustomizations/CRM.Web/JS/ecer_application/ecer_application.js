// JavaScript source code
if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.Application =
{

    crm_ExecutionContext: null,
    OnLoad: function (executionContext) {
        this.crm_ExecutionContext = executionContext;
        // var formContext = executionContext.getFormContext();
        // var formType = formContext.ui.getFormType();
        ECER.Jscripts.Application.showHideApplicantQuickView(executionContext);
        // Age Evaluation is done by Power Automate flow on submit of the application
        ECER.Jscripts.Application.showHideParentalGuidianceFieldsOnApplicantAge(executionContext);
        ECER.Jscripts.Application.levelOfRequirmentOnDenailReasonTypeChange(executionContext);
        ECER.Jscripts.Application.levelOfRequirementOnStatusReasonDetailsChange(executionContext);
        ECER.Jscripts.Application.showHideProfessionalDevelopmentFieldsOnRenewals(executionContext);
        ECER.Jscripts.Application.showHideEducationFieldsOnRenewals(executionContext);
        ECER.Jscripts.Application.enableDisableFieldsBySecurityRole(executionContext);
        ECER.Jscripts.Application.showHideLateRenewalExplanation(executionContext);
        ECER.Jscripts.Application.showHideFromCertificate(executionContext);
        ECER.Jscripts.Application.showHideEquivalencyFields(executionContext);
        ECER.Jscripts.Application.parallelProcessToggle(executionContext);
        ECER.Jscripts.Application.workExperienceExemption(executionContext);
        ECER.Jscripts.Application.showHideEscalationFields(executionContext);
        ECER.Jscripts.Application.registrantHasActiveCondition(executionContext);
        ECER.Jscripts.Application.ShowHideCertificationComparision(executionContext);
    },

    registrantHasActiveCondition: function (executionContext) {
        try {
            var formContext = executionContext.getFormContext();
            var applicantAttributeName = "ecer_applicantid";
            var applicantAttribute = formContext.getAttribute(applicantAttributeName);
            var applicant = applicantAttribute.getValue();
            if (applicant === null) {
                return null;
            }
            var applicantid = applicant[0].id.replace("{", "").replace("}", "");
            ECER.Jscripts.Contact.registrantHasActiveCondition(executionContext, applicantid);
        }
        catch (ex) {
            // Do Nothing.  Depends on which version, EFX has the script but not PROD.

        }
    },

    parallelProcessToggle: function (executionContext) {

        // Display the Parallel Process form section if the Parallel Process toggle = Yes
        // Display a warning on the application if the Parallel Process toggle = Yes.
        var formContext = executionContext.getFormContext();
        var parallelProcess = formContext.getAttribute("ecer_parallelprocess").getValue();
        if (parallelProcess === true) {
            crm_Utility.showHide(executionContext, true, "tab_applicantinformation:section_applicantinformation_parallel_process");
            formContext.ui.setFormNotification("Application currently under Parallel Process.", "WARNING", "sectionWarning");

        } else {
            crm_Utility.showHide(executionContext, false, "tab_applicantinformation:section_applicantinformation_parallel_process");
            formContext.ui.clearFormNotification("sectionWarning");
        }

    },

    workExperienceExemption: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var isECEAssistant = formContext.getAttribute("ecer_iseceassistant").getValue();
        var isECE1YR = formContext.getAttribute("ecer_isece1yr").getValue();
        var isSNE = formContext.getAttribute("ecer_issne").getValue();
        var isITE = formContext.getAttribute("ecer_isite").getValue();
        var isECE5YR = formContext.getAttribute("ecer_isece5yr").getValue();
        var isPostBasicOnly = (isSNE || isITE) && !isECE5YR;
        var typeAttributeName = "ecer_type";
        var typeAttribute = formContext.getAttribute(typeAttributeName);
        var isRenewal = typeAttribute != null && typeAttribute.getValue() != null && typeAttribute.getValue() == 621870001;
        var isLate = ECER.Jscripts.Application.isRenewalLate(executionContext);
        var renewalsLateInYearsAttributeName = "ecer_renewalslateinyears";
        var renewalsLateInYearsAttribute = formContext.getAttribute(renewalsLateInYearsAttributeName);
        var renewalLateInYears = 0;
        if (renewalsLateInYearsAttribute != null && renewalsLateInYearsAttribute.getValue() != null) {
            renewalLateInYears = renewalsLateInYearsAttribute.getValue();
        }
        var is1YrRenewalsLateButLessThan5Yrs = isRenewal && isECE1YR && renewalLateInYears > 0 && renewalLateInYears <= 5;
        var wkExempted = ((isECE1YR && !isRenewal) || (isECEAssistant && !isRenewal) || (isECE1YR && !is1YrRenewalsLateButLessThan5Yrs)) || isPostBasicOnly;

        // Renewal 1YR if Expired is not exempted.

        // ECER-3338
        // Work Experience for New Application 1 YEAR is NOT Required
        // Work Experience for New Application Assistnat is also NOT Required
        // Otherwise, the WK is required at BPF
        // BPF field can only be set from none to required.
        // Hiding will take away the Required too
        // There is no exemption at Field, JUST BPF Stage
        var bpfWorkExperienceReceivedAttributeName = "header_process_ecer_workexperiencereceived";
        crm_Utility.showHide(executionContext, !wkExempted, bpfWorkExperienceReceivedAttributeName);
        crm_Utility.showHide(executionContext, !wkExempted, "ecer_workexperiencereceived");
        crm_Utility.showHide(executionContext, !wkExempted, "ecer_workexperiencereceiveddate");
        crm_Utility.showHide(executionContext, !wkExempted, "ecer_addmoreworkexperiencereference");
        crm_Utility.showHide(executionContext, !wkExempted, "ecer_workexperiencereferenceapproved");
        crm_Utility.showHide(executionContext, !wkExempted, "ecer_hasprovided500hoursworkexperience");
        crm_Utility.showHide(executionContext, !wkExempted, "ecer_hasprovided400hoursworkexperience");
        crm_Utility.showHide(executionContext, !wkExempted, "header_process_ecer_workexperiencereferenceapproved");
        crm_Utility.showHide(executionContext, !wkExempted, "header_process_ecer_workexperiencereferenceapproved_1");
        crm_Utility.showHide(executionContext, !wkExempted, "header_process_ecer_workexperiencereferenceapproved_2");
        crm_Utility.showHide(executionContext, !wkExempted, "header_process_ecer_workexperiencereferenceapproved_3");
        crm_Utility.showHide(executionContext, !wkExempted, "header_process_ecer_workexperiencereferenceapproved_4");
        crm_Utility.showHide(executionContext, !wkExempted, "header_process_ecer_workexperiencereferenceapproved_5");
        crm_Utility.showHide(executionContext, !wkExempted, "tab_workexperience");

    },

    isRenewalLate: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var applicantAttributeName = "ecer_applicantid";
        var applicantAttribute = formContext.getAttribute(applicantAttributeName);
        var applicant = applicantAttribute.getValue();
        if (applicant === null) {
            return null;
        }
        var applicantid = applicant[0].id.replace("{", "").replace("}", "");
        var dateSubmittedAttributeName = "ecer_datesubmitted";
        var dateToCompare = null;
        var dateSubmittedValue = formContext.getAttribute(dateSubmittedAttributeName).getValue();
        if (dateSubmittedValue === null) {
            var today = new Date();
            dateToCompare = today;
        }
        else {
            dateToCompare = dateSubmittedValue;
        }

        var latestCertificate = ECER.Jscripts.Application.getApplicantLatestCertificate(executionContext, applicantid, dateToCompare);
        if (latestCertificate === null) {
            return; // No Certifcate means it should not be a renewal or expired more than 5 Yrs.
        }
        var certificateExpiryDate = new Date(Date.parse(latestCertificate["ecer_expirydate"]));
        // Late is when Expiry Date has already passed.
        var isLate = dateToCompare.getTime() > certificateExpiryDate.getTime();
        return isLate;
    },

    showHideEquivalencyFields: function (executionContext) {

        // ECER-2882
        // When an applications education origin and recognition makes the application an equivalency application. 
        // The correct fields need to be visible.
        // Fields that do not relate to the Equivalency Application and processing path should be hidden to reduce clutter 
        // and increase visibility for the users.
        var formContext = executionContext.getFormContext();
        var educationRecognitionAttributeName = "ecer_educationrecognition";
        var educationRecognitionValue = formContext.getAttribute(educationRecognitionAttributeName).getValue();
        var isNotRecognized = educationRecognitionValue === 621870001; // Not Recognized
        var typeAttributeName = "ecer_type";
        var typeAttribute = formContext.getAttribute(typeAttributeName);
        var isNew = typeAttribute != null && typeAttribute.getValue() != null && typeAttribute.getValue() == 621870000;

        // ECER-4322
        // If Education Origin == Inside BC or Outside BC, hide Comprehensive Evaluation Report Received field 
        var educationOriginAttributeName = "ecer_educationorigin";
        var educationOriginalValue = formContext.getAttribute(educationOriginAttributeName).getValue();
        var isInsideBC = educationOriginalValue === 621870000; // Inside BC
        var isOutsideBC = educationOriginalValue === 621870001; // Outside BC
        var hideComprehensiveEvaulationReport = (isInsideBC || isOutsideBC);

        // ECER-4322
        // If ECE Assistant is YES, hide Program Confirmation Form Received field and BPF field
        var isECEAssistant = formContext.getAttribute("ecer_iseceassistant").getValue();

        var show = isNew && isNotRecognized;

        // Completeness Review
        crm_Utility.showHide(executionContext, show && !isECEAssistant, "header_process_ecer_programconfirmationformreceived");
        crm_Utility.showHide(executionContext, show && !isECEAssistant, "ecer_programconfirmationformreceived");
        crm_Utility.showHide(executionContext, show && !isECEAssistant, "ecer_programconfirmationformreceiveddate");
        crm_Utility.showHide(executionContext, show && !isECEAssistant, "ecer_programconfirmationreviewed");

        crm_Utility.showHide(executionContext, show, "header_process_ecer_courseoutlinereceived");
        crm_Utility.showHide(executionContext, show, "ecer_courseoutlinereceived");
        crm_Utility.showHide(executionContext, show, "ecer_courseoutlinereceiveddate");
        crm_Utility.showHide(executionContext, show, "ecer_courseoutlinesreviewed");

        crm_Utility.showHide(executionContext, show && !hideComprehensiveEvaulationReport, "header_process_ecer_comprehensiveevaluationreportreceived");
        crm_Utility.showHide(executionContext, show && !hideComprehensiveEvaulationReport, "ecer_comprehensiveevaluationreportreceived");
        crm_Utility.showHide(executionContext, show && !hideComprehensiveEvaulationReport, "ecer_comprehensiveevaluationreportreceiveddate");
        crm_Utility.showHide(executionContext, show && !hideComprehensiveEvaulationReport, "ecer_cerreviewed");

        crm_Utility.showHide(executionContext, show, "ecer_educationtranscriptreviewed");

        // Assessment
        crm_Utility.showHide(executionContext, show, "ecer_curriculumapproved");

        // Assessment BPF for Equivalency field is on a different path and does not needed to show hide
        // BPF has already been adjusted to remove the 4 approved fields,
        // Course Outline Approved, Program Confirmation Approved, Education Transcript Approved and Comprehensive Evaluation Report 
        // and just leave Curriculum Approved accordingly
    },

    showHideFromCertificate: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var applicantAttributeName = "ecer_applicantid";
        var typeAttributeName = "ecer_type";
        var fromCertificateAttributeName = "ecer_fromcertificateid";
        var type = formContext.getAttribute(typeAttributeName).getValue();
        var applicant = formContext.getAttribute(applicantAttributeName).getValue();
        var fromCertificate = formContext.getAttribute(fromCertificateAttributeName).getValue();
        var showFromCertificate = (type === 621870001 && applicant !== null);
        crm_Utility.showHide(executionContext, showFromCertificate, fromCertificateAttributeName);

        if (fromCertificate === null && showFromCertificate) {
            var today = new Date();
            var latestCertificate = ECER.Jscripts.Application.getApplicantLatestCertificate(executionContext, applicant[0].id, today);
            if (latestCertificate !== null) {
                var latestCertificateLookup = crm_Utility.generateLookupObject("ecer_certificate", latestCertificate.ecer_certificateid, latestCertificate.ecer_name);
                crm_Utility.setLookupValue(executionContext, fromCertificateAttributeName, latestCertificateLookup);
            }
        }

    },

    getApplicantLatestCertificate: function (executionContext, applicantid, dateToCompare) {
        var formContext = executionContext.getFormContext();
        var isECEAssistant = formContext.getAttribute("ecer_iseceassistant").getValue();
        var isECE1YR = formContext.getAttribute("ecer_isece1yr").getValue();
        var certifiedlevel = "ECE 5 YR";
        if (isECE1YR) {
            certifiedlevel = "ECE 1 YR";
        }
        else if (isECEAssistant) {
            certifiedlevel = "ASS"; // Data Migration ones might be ASST.  New ones should be ECE Assistant
        }
        var fiveYearsAgo = new Date(dateToCompare.getFullYear() - 5, dateToCompare.getMonth(), dateToCompare.getDate());

        var certificateQueryOption = "?$filter=_ecer_registrantid_value eq '" +
            applicantid + "'" +
            " and statuscode eq 1" + // active 
            " and ecer_expirydate ne null" +
            " and contains(ecer_certificatelevel,'" + certifiedlevel + "')" +
            /* " and ecer_expirydate gt " +
             fiveYearsAgo.toISOString().substring(0, 10) + */
            "&$orderby=ecer_expirydate desc&$top=1";
        var latestCertificates = crm_Utility.retrieveMultipleCustom("ecer_certificate", certificateQueryOption);
        if (latestCertificates == null) {
            return null;
        }

        if (latestCertificates.length === 0) {
            return null;
        }

        var latestCertificate = latestCertificates[0];
        return latestCertificate;
    },
    ShowHideCertificationComparision: function (executionContext) {
        //ECER - 2917 - Display Certificate Comparison on Application
        var formContext = executionContext.getFormContext();
        var typeAttributeName = "ecer_type";
        var certificateComparisonTabName = "tab_certificationcomparison";
        var labourMobilityValue = 621870003; // Value for 'Labour Mobility'

        var typeAttribute = formContext.getAttribute(typeAttributeName);
        var isLabourMobility = typeAttribute && typeAttribute.getValue() === labourMobilityValue;

        crm_Utility.showHide(executionContext, isLabourMobility, certificateComparisonTabName);
    },


    showHideLateRenewalExplanation: function (executionContext) {
        // ECER-2996
        // Show if Expiry Date has passed but within 5 years
        // 1 YR and 5 YR Respectively

        var formContext = executionContext.getFormContext();
        var typeAttributeName = "ecer_type";
        var isECE1YrAttributeName = "ecer_isece1yr";
        var isECE5YrAttributeName = "ecer_isece5yr";
        var oneYearExplanationAttributeName = "ecer_1yrexplanationchoice";
        var fiveYearExplanationAttributeName = "ecer_5yrexplanationchoice";
        var otherRenewalExplanationAttributeName = "ecer_renewalexplanationother";
        var lateRenewalExplanationTabName = "tab_laterenewalexplanation";

        // Hide the extra Other Option set remains due to deployment unable to upgrade and remove
        crm_Utility.filterOutOptionSet(executionContext, oneYearExplanationAttributeName, "621870005");

        var typeAttribute = formContext.getAttribute(typeAttributeName);
        var isRenewal = typeAttribute != null && typeAttribute.getValue() != null && typeAttribute.getValue() == 621870001;
        // Rules.
        // If Not Renewals, then do nothing.
        if (!isRenewal) {
            return;
        }
        var oneYearChoiceAsOther = false;
        var fiveYearChoiceAsOther = false;
        // If it already contains data, then show it.
        var oneYearExplanationValue = formContext.getAttribute(oneYearExplanationAttributeName).getValue();
        var oneYearHasValue = (oneYearExplanationValue !== null);
        crm_Utility.showHide(executionContext, oneYearHasValue, oneYearExplanationAttributeName);
        if (oneYearHasValue) {
            oneYearChoiceAsOther = oneYearExplanationValue === 621870004;
        }

        var fiveYearExplanationValue = formContext.getAttribute(fiveYearExplanationAttributeName).getValue();
        var fiveYearHasValue = (fiveYearExplanationValue !== null);
        crm_Utility.showHide(executionContext, fiveYearHasValue, fiveYearExplanationAttributeName);
        if (fiveYearHasValue) {
            fiveYearChoiceAsOther = fiveYearExplanationValue === 621870004;
        }

        // If Choice is Other, then Show the Other Renewal Explanation Textbox
        crm_Utility.showHide(executionContext, (oneYearChoiceAsOther || fiveYearChoiceAsOther), otherRenewalExplanationAttributeName);

        // If either 1YR or 5YR Explanation has value, then show the tab.
        crm_Utility.showHide(executionContext, (oneYearHasValue || fiveYearHasValue), lateRenewalExplanationTabName);

        if (oneYearHasValue || fiveYearHasValue) {
            return; // As it has already been shown.
        }

        // If it does not already contains data, it becomes complicated.
        var applicantAttributeName = "ecer_applicantid";
        var applicantAttribute = formContext.getAttribute(applicantAttributeName);
        var applicant = applicantAttribute.getValue();
        if (applicant === null) {
            return null;
        }
        var applicantid = applicant[0].id.replace("{", "").replace("}", "");

        var dateSubmittedAttributeName = "ecer_datesubmitted";
        var dateToCompare = null;
        var dateSubmittedValue = formContext.getAttribute(dateSubmittedAttributeName).getValue();
        if (dateSubmittedValue === null) {
            var today = new Date();
            dateToCompare = today;
        }
        else {
            dateToCompare = dateSubmittedValue;
        }

        var latestCertificate = ECER.Jscripts.Application.getApplicantLatestCertificate(executionContext, applicantid, dateToCompare);
        if (latestCertificate === null) {
            return; // No Certifcate means it should not be a renewal or expired more than 5 Yrs.
        }
        var latestCertificateExpiryDate = new Date(Date.parse(latestCertificate["ecer_expirydate"]));
        var certificateExpiryDatePlus5YR = new Date(Date.parse(latestCertificate["ecer_expirydate"]));
        var isECE1Yr = formContext.getAttribute(isECE1YrAttributeName).getValue();
        var isECE5Yr = formContext.getAttribute(isECE5YrAttributeName).getValue();
        certificateExpiryDatePlus5YR.setFullYear(latestCertificateExpiryDate.getFullYear() + 5);
        // Late is when Expiry Date has already passed.
        var isLateWithin5Yr = dateToCompare.getTime() <= certificateExpiryDatePlus5YR.getTime();
        var isLate5Yr = latestCertificateExpiryDate.getTime() <= dateToCompare.getTime();
        var isStillActive = dateToCompare.getTime() < latestCertificateExpiryDate.getTime();
        // ECE 1YR to show
        // Is Late but within 5 Years
        // Or Active
        var show1YR = isECE1Yr && (isLateWithin5Yr || isStillActive);
        var show5YR = isECE5Yr && (isLateWithin5Yr && isLate5Yr);

        crm_Utility.showHide(executionContext, show1YR, oneYearExplanationAttributeName);
        crm_Utility.showHide(executionContext, show5YR, fiveYearExplanationAttributeName);
        crm_Utility.showHide(executionContext, (show1YR || show5YR), lateRenewalExplanationTabName);
    },

    showHideApplicantQuickView: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var applicantAttribute = formContext.getAttribute("ecer_applicantid");
        var applicant = applicantAttribute.getValue();
        var showQuickView = true;
        if (applicant == null) {
            // Show the fields        
            showQuickView = false;
        }
        var quickViewControl = formContext.ui.quickForms.get("qv_applicantinformation");
        if (quickViewControl != null) {
            quickViewControl.setVisible(showQuickView);
        }
        crm_Utility.showHide(executionContext, !showQuickView, "tab_applicantinformation:section_contactnames");
        crm_Utility.showHide(executionContext, !showQuickView, "tab_applicantinformation:section_applicantaddress");
        crm_Utility.showHide(executionContext, !showQuickView, "header_process_ecer_isprimaryidentificationprovided");
        crm_Utility.showHide(executionContext, !showQuickView, "header_process_ecer_issecondaryidentificationprovided");


    },

    setDateOnToggle: function (executionContext, toggleFieldName, dateFieldName) {
        // ECER.Jscripts.Application.setDateOnToggle(executionContext, "ecer_characterreferencereceived", "ecer_characterreferencereceiveddate");
        var formContext = executionContext.getFormContext();
        var dateAttribute = formContext.getAttribute(dateFieldName);
        var isTrue = false;
        if (formContext.getAttribute(toggleFieldName) && formContext.getAttribute(toggleFieldName).getValue() != null) {
            isTrue = formContext.getAttribute(toggleFieldName).getValue();
        }
        if (isTrue) {
            var now = new Date();
            var dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateAttribute.setValue(dateOnly);
        }
        else {
            dateAttribute.setValue(null);
        }
    },

    closeFormIfDraft: function (executionContext) {
        var hasViewDraftRole = crm_Utility.checkCurrentUserRole("View Draft Records");
        crm_Utility.showMessage("Has View Draft Records Role: " + hasViewDraftRole);
    },

    setApplicationStatusOnReadyForAssessment: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var readyForAssessmentAttribute = formContext.getAttribute("ecer_readyforassessment");
        var statuscode = 621870001; // Submitted
        var subStatusDetails = null;
        if (readyForAssessmentAttribute != null && readyForAssessmentAttribute.getValue() != null) {
            if (readyForAssessmentAttribute.getValue()) {
                statuscode = 621870002; // Ready
                subStatusDetails = 621870003; // Ready for Assessment
            }
        }

        var statuscodeAttribute = formContext.getAttribute("statuscode");
        var statusReasonDetailsAttribute = formContext.getAttribute("ecer_statusreasondetail");
        statuscodeAttribute.setValue(statuscode);
        statusReasonDetailsAttribute.setValue(subStatusDetails);
    },

    enableDisableFieldsBySecurityRole: function (executionContext) {
        // ECER 2271

        var formContext = executionContext.getFormContext();
        var formType = formContext.ui.getFormType();
        if (formType !== 1 && formType !== 2) {
            // if neither Create Mode or Update mode
            // This should stop field from unlocking if record is deactivated
            return;
        }
        // https://eccbc.atlassian.net/wiki/spaces/ECER/pages/473793507/ECER+-+Application+Form+Validation
        var statusreason = formContext.getAttribute("statuscode").getValue(); // Status Reason is under Assessment tab
        var assessorRole = crm_Utility.checkCurrentUserRole("Certification - Assessor Role");
        var programAnalystRole = crm_Utility.checkCurrentUserRole("Equivalency - ECE Program Analyst Role");
        var certificateAnalystRole = crm_Utility.checkCurrentUserRole("Equivalency - Certification Analyst");
        var operationSupervisorEquivalencyRole = crm_Utility.checkCurrentUserRole("Equivalency - Operations Supervisor Equivalency Role");
        var programCoordinatorRole = crm_Utility.checkCurrentUserRole("Equivalency - Program Coordinator Role");
        var managerOfCertificationRole = crm_Utility.checkCurrentUserRole("Certifications - Manager of Certifications Role");
        var assessorTeamLeadRole = crm_Utility.checkCurrentUserRole("Certification - Team Lead Role");
        var programSupportRole = crm_Utility.checkCurrentUserRole("Certification - Program Support Role");
        var programSupportLeadRole = crm_Utility.checkCurrentUserRole("Certification - Program Support Lead Role");
        var operationSupervisorRole = crm_Utility.checkCurrentUserRole("Certification - Operations Supervisor Assessment Role");
        var investigatorRole = crm_Utility.checkCurrentUserRole("Investigation - Investigator");
        var sysAdminRole = crm_Utility.checkCurrentUserRole("System Administrator");
        var alwaysOpen = !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole || programSupportRole ||
            programSupportLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole || investigatorRole);
        var beforeAssessmentPS = (statusreason === 1 || statusreason === 621870001) && (programSupportRole || programSupportLeadRole);
        var originValue = formContext.getAttribute("ecer_origin").getValue();
        var notFromPortal = originValue !== 621870001;

        // Application Information Tab - General
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || beforeAssessmentPS || assessorRole || programAnalystRole || certificateAnalystRole ||
            assessorTeamLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole || managerOfCertificationRole || investigatorRole), "ecer_type");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || beforeAssessmentPS || assessorRole || programAnalystRole || certificateAnalystRole ||
            assessorTeamLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole || managerOfCertificationRole || investigatorRole), "ecer_educationorigin");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || beforeAssessmentPS || assessorRole || programAnalystRole || certificateAnalystRole ||
            assessorTeamLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole || managerOfCertificationRole || investigatorRole), "ecer_educationrecognition");

        // Application Information Tab - Certificate Type(s)
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || beforeAssessmentPS || assessorRole || programAnalystRole || certificateAnalystRole ||
            assessorTeamLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole ||
            managerOfCertificationRole || investigatorRole), "ecer_iseceassistant");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || beforeAssessmentPS || assessorRole || programAnalystRole || certificateAnalystRole ||
            assessorTeamLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole ||
            managerOfCertificationRole || investigatorRole), "ecer_isece1yr");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || beforeAssessmentPS || assessorRole || programAnalystRole || certificateAnalystRole ||
            assessorTeamLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole ||
            managerOfCertificationRole || investigatorRole), "ecer_isece5yr");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || beforeAssessmentPS || assessorRole || programAnalystRole || certificateAnalystRole ||
            assessorTeamLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole ||
            managerOfCertificationRole || investigatorRole), "ecer_isite");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || beforeAssessmentPS || assessorRole || programAnalystRole || certificateAnalystRole ||
            assessorTeamLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole ||
            managerOfCertificationRole || investigatorRole), "ecer_issne");

        // Application Information Tab - Applicant
        crm_Utility.enableDisable(executionContext, !(programSupportRole || programSupportLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole || sysAdminRole), "ecer_applicantid");
        // Application Information Tab - Contact Names - Manual Application
        // All Enable - By Form Configurations

        // Application Information Tab - Applicant Address - Manual Application
        // All Enable - By Form Configurations

        // Completeness Review Tab - Confirm Information Received (Internal Use)
        crm_Utility.enableDisable(executionContext, !sysAdminRole, "ecer_characterreferencereceived");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || notFromPortal), "ecer_characterreferencereceiveddate");
        crm_Utility.enableDisable(executionContext, !sysAdminRole, "ecer_workexperiencereceived");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || notFromPortal), "ecer_workexperiencereceiveddate");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || programSupportRole || programSupportLeadRole), "ecer_transcriptreceived");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || notFromPortal), "ecer_transcriptreceiveddate");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || programSupportRole || programSupportLeadRole), "ecer_parentalreferencereceived");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || notFromPortal), "ecer_parentalreferencereceiveddate");
        crm_Utility.enableDisable(executionContext, !sysAdminRole, "ecer_hasprofessionaldevelopment");
        crm_Utility.enableDisable(executionContext, !sysAdminRole, "ecer_professionaldevelopmentreceived");

        // Equivalency - Confirm Information Received (Internal Use)
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || notFromPortal || beforeAssessmentPS || programAnalystRole || certificateAnalystRole || managerOfCertificationRole), "ecer_programconfirmationformreceived");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || notFromPortal), "ecer_programconfirmationformreceiveddate");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || notFromPortal || beforeAssessmentPS || programAnalystRole || certificateAnalystRole || managerOfCertificationRole), "ecer_courseoutlinereceived");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || notFromPortal), "ecer_courseoutlinereceiveddate");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || notFromPortal || beforeAssessmentPS || programAnalystRole || certificateAnalystRole || managerOfCertificationRole), "ecer_comprehensiveevaluationreportreceived");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || notFromPortal), "ecer_comprehensiveevaluationreportreceiveddate");

        // Completeness Review Tab - Ready for Assessment
        crm_Utility.enableDisable(executionContext, alwaysOpen, "ecer_readyforassessment"); // Always open
        crm_Utility.enableDisable(executionContext, !sysAdminRole, "ecer_readyforassessmentdate");

        // Completeness Review Tab - Request More References (These allow Portal User to upload more references)
        crm_Utility.enableDisable(executionContext, alwaysOpen, "ecer_addmorecharacterreference"); // Always open
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole), "ecer_addmoreworkexperiencereference");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole), "ecer_addmoreprofessionaldevelopment");

        // Assessment Tab - Application Assessment
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole ||
            assessorTeamLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole ||
            managerOfCertificationRole || investigatorRole), "ecer_workexperiencereferenceapproved");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole ||
            assessorTeamLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole ||
            managerOfCertificationRole || investigatorRole), "ecer_characterreferenceapproved");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole ||
            assessorTeamLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole ||
            managerOfCertificationRole || investigatorRole), "ecer_parentalreferenceapproved");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole ||
            assessorTeamLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole ||
            managerOfCertificationRole || investigatorRole), "ecer_educationtranscriptapproved");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole ||
            assessorTeamLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole ||
            managerOfCertificationRole || investigatorRole), "ecer_professionaldevelopmentapproved");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole ||
            assessorTeamLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole ||
            managerOfCertificationRole || investigatorRole), "ecer_curriculumapproved");

        // Assessment Tab - Work Experience Assessment TBD
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || beforeAssessmentPS || assessorRole || programAnalystRole || certificateAnalystRole ||
            assessorTeamLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole ||
            managerOfCertificationRole || investigatorRole), "ecer_hasprovided500hoursworkexperience");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || beforeAssessmentPS || assessorRole || programAnalystRole || certificateAnalystRole ||
            assessorTeamLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole ||
            managerOfCertificationRole || investigatorRole), "ecer_hasprovided400hoursworkexperience");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || beforeAssessmentPS || assessorRole || programAnalystRole || certificateAnalystRole ||
            assessorTeamLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole ||
            managerOfCertificationRole || investigatorRole), "ecer_explanationletter");

        // Assessment Tab - Application Decision
        crm_Utility.enableDisable(executionContext, alwaysOpen, "statuscode"); // Always open
        crm_Utility.enableDisable(executionContext, alwaysOpen, "ecer_statusreasondetail"); // Always open
        crm_Utility.enableDisable(executionContext, true, "ecer_certificateid"); // Always Read Only
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole), "ecer_decisiondate");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole), "ecer_generatecertificaterecord");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole), "ecer_denialreasontype");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole), "ecer_denialreasonexplanation");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole), "ecer_printrequest");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole), "ecer_appealperiodenddate");

        // Assessment Tab - Escalation
        crm_Utility.enableDisable(executionContext, !sysAdminRole, "ecer_dateescalated");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole), "ecer_escalatetoteamlead");
        crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole), "ecer_escalatereason");

        // Declaration Tab - Declaration and Consent
        // Locked by Form Configurations

        // Work Experience Reference Tab
        // Total Anticipated, Observed, Approved hours locked by Form Configuration

        // BPF - Submission Stage
        try {
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || programSupportRole || programSupportLeadRole || investigatorRole), "header_process_ecer_isprimaryidentificationprovided");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || programSupportRole || programSupportLeadRole || investigatorRole), "header_process_ecer_issecondaryidentificationprovided");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || programSupportRole || programSupportLeadRole || investigatorRole), "header_process_ecer_applicantid");
            crm_Utility.enableDisable(executionContext, !sysAdminRole, "header_process_ecer_characterreferencereceived");
            crm_Utility.enableDisable(executionContext, !sysAdminRole, "header_process_ecer_professionaldevelopmentreceived");
            crm_Utility.enableDisable(executionContext, !sysAdminRole, "header_process_ecer_workexperiencereceived");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || programSupportRole || programSupportLeadRole || investigatorRole), "header_process_ecer_transcriptreceived");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || programSupportRole || programSupportLeadRole), "header_process_ecer_parentalreferencereceived");
            crm_Utility.enableDisable(executionContext, !sysAdminRole, "header_process_ecer_hasprofessionaldevelopment");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole || programSupportRole ||
                programSupportLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole), "header_process_ecer_readyforassessment")


            // BPF - Assessment Stage
            crm_Utility.enableDisable(executionContext, alwaysOpen, "header_process_statuscode");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || beforeAssessmentPS || assessorRole || programAnalystRole || certificateAnalystRole ||
                assessorTeamLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_type");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || beforeAssessmentPS || assessorRole || programAnalystRole || certificateAnalystRole ||
                assessorTeamLeadRole || operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_educationorigin");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || beforeAssessmentPS || assessorRole || programAnalystRole || certificateAnalystRole ||
                assessorTeamLeadRole || operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_educationrecognition");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_workexperiencereferenceapproved");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_characterreferenceapproved");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_parentalreferenceapproved");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_educationtranscriptapproved");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_professionaldevelopmentapproved");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_escalatetoteamlead");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_escalatereason");

            // BPF - Assessment Review Stage
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_workexperiencereferenceapproved_3");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_characterreferenceapproved_3");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_parentalreferenceapproved_1");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_educationtranscriptapproved_3");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_professionaldevelopmentapproved_1");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_routetoassessmentteam_1");

            // BPF - Assessment Stage after pass back to Assessor
            crm_Utility.enableDisable(executionContext, alwaysOpen, "header_process_statuscode_2");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || beforeAssessmentPS || assessorRole || programAnalystRole || certificateAnalystRole ||
                assessorTeamLeadRole || operationSupervisorRole || operationSupervisorEquivalencyRole || programCoordinatorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_type_2");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_educationorigin_2");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_educationrecognition_2");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_workexperiencereferenceapproved_4");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_characterreferenceapproved_4");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_parentalreferenceapproved_2");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_educationtranscriptapproved_4");
            crm_Utility.enableDisable(executionContext, !(sysAdminRole || assessorRole || programAnalystRole || certificateAnalystRole || assessorTeamLeadRole ||
                operationSupervisorRole || managerOfCertificationRole || investigatorRole), "header_process_ecer_professionaldevelopmentapproved_2");

            // BPF - Complete Stage
            crm_Utility.enableDisable(executionContext, !sysAdminRole, "header_process_ecer_certificateid_5");
            crm_Utility.enableDisable(executionContext, !sysAdminRole, "header_process_ecer_certificateid_4");
            crm_Utility.enableDisable(executionContext, !sysAdminRole, "header_process_ecer_certificateid_3");
            crm_Utility.enableDisable(executionContext, !sysAdminRole, "header_process_ecer_certificateid_2");
            crm_Utility.enableDisable(executionContext, !sysAdminRole, "header_process_ecer_certificateid");
        }
        catch (err) {
            crm_Utility.showMessage("BPF Re-factor in progress.  There may have some form script error during the change");
        }
    },

    hasAssessorSecurityRole: function () {
        var hasAssessorRole = crm_Utility.checkCurrentUserRole("Certification - Assessor Role");
        return hasAssessorRole;
    },

    hasProgramClerkSecurityRole: function () {
        // Directive to prevent use of undeclared variables
        var hasProgramSupportRole = crm_Utility.checkCurrentUserRole("Certification - Program Support Role");
        var hasProgramSupportLeadRole = crm_Utility.checkCurrentUserRole("Certification - Program Support Lead Role");
        return hasProgramSupportLeadRole || hasProgramSupportRole;
    },

    preventAutoSave: function (executionContext) {
        try {
            var eventArgs = executionContext.getEventArgs();
            if (eventArgs.getSaveMode() == 70) {
                eventArgs.preventDefault();
            }
        }
        catch (e) {

        }
    },

    assignToAssessmentTeamLeadTeamOnEscalated: function (executionContext) {
        alert("Test Trigger: assignToAssessmentTeamLeadTeamOnEscalated");
    },

    // ECER-1370
    levelOfRequirmentOnDenailReasonTypeChange: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var denialReasonTypeAttribute = formContext.getAttribute("ecer_denialreasontype");
        var denialReasonExplanationAttributeName = "ecer_denialreasonexplanation";
        var denailReasonTypeOTHER = "dccf621f-a1d5-ee11-904c-000d3af4a207";
        if (denialReasonTypeAttribute === null) {
            return; // If Status Reason Details is NOT on form, then nothing to compare to
        }

        var denialReasonExplanationRequired = "none";
        if (denialReasonTypeAttribute.getValue() !== null) {
            var denialReasonTypeValue = denialReasonTypeAttribute.getValue()[0].id.toLowerCase().replace("{", "").replace("}", "");
            if (denialReasonTypeValue === denailReasonTypeOTHER) {
                // OTHER
                denialReasonExplanationRequired = "required";
            }
        }

        crm_Utility.setRequiredLevel(executionContext, denialReasonExplanationRequired, denialReasonExplanationAttributeName);
    },
    // ECER-1370
    levelOfRequirementOnStatusReasonDetailsChange: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var statusReasonDetailsAttribute = formContext.getAttribute("ecer_statusreasondetail");
        var denialReasonExplanationAttributeName = "ecer_denialreasonexplanation";
        var generateCertificateRecordAttributeName = "ecer_generatecertificaterecord";
        var denialReasonTypeAttributeName = "ecer_denialreasontype";
        if (statusReasonDetailsAttribute == null) {
            return; // If Status Reason Details is NOT on form, then nothing to compare to
        }

        var statusReasonDetailsValue = statusReasonDetailsAttribute.getValue();
        var denialReasonTypeRequired = "none";
        var denialReasonDisable = true;
        var certifiedDisable = true;
        if (statusReasonDetailsValue === 621870011) {
            // Denied
            denialReasonTypeRequired = "required";
            denialReasonDisable = false;
        }
        if (statusReasonDetailsValue === 621870010) {
            // Certified
            certifiedDisable = false;
        }
        crm_Utility.enableDisable(executionContext, certifiedDisable, generateCertificateRecordAttributeName);
        crm_Utility.enableDisable(executionContext, denialReasonDisable, denialReasonExplanationAttributeName);
        crm_Utility.enableDisable(executionContext, denialReasonDisable, denialReasonTypeAttributeName);
        crm_Utility.setRequiredLevel(executionContext, denialReasonTypeRequired, denialReasonTypeAttributeName);
    },

    showHideProfessionalDevelopmentFieldsOnRenewals: function (executionContext) {

        var formContext = executionContext.getFormContext();
        var typeAttributeName = "ecer_type";
        var isECEAssistantAttributeName = "ecer_iseceassistant";
        var isECE1YRAttributeName = "ecer_isece1yr";
        var renewalsLateInYearsAttributeName = "ecer_renewalslateinyears";
        var typeAttribute = formContext.getAttribute(typeAttributeName);
        var isECEAssistantAttribute = formContext.getAttribute(isECEAssistantAttributeName);
        var isECE1YRAttribute = formContext.getAttribute(isECE1YRAttributeName);
        var renewalsLateInYearsAttribute = formContext.getAttribute(renewalsLateInYearsAttributeName);
        var isRenewal = typeAttribute != null && typeAttribute.getValue() != null && typeAttribute.getValue() == 621870001;
        var isECEAssistant = isECEAssistantAttribute != null && isECEAssistantAttribute.getValue() != null && isECEAssistantAttribute.getValue() == true;

        // Per ECER-4128
        // Professional Development is only required for ECE 1 YR renewal
        // when the previous certificate has already expired and has expired less than 5 years.
        var isECE1YR = isECE1YRAttribute != null && isECE1YRAttribute.getValue() != null && isECE1YRAttribute.getValue() == true;
        var renewalLateInYears = 0;
        if (renewalsLateInYearsAttribute != null && renewalsLateInYearsAttribute.getValue() != null) {
            renewalLateInYears = renewalsLateInYearsAttribute.getValue();
        }
        var is1YrRenewalsLateButLessThan5Yrs = isRenewal && isECE1YR && renewalLateInYears > 0 && renewalLateInYears <= 5;
        var isRenewalsButNotECE1Yr = isRenewal && !isECE1YR;
        var show = (is1YrRenewalsLateButLessThan5Yrs || isRenewalsButNotECE1Yr) && !isECEAssistant;

        var professionalDevelopmentTabName = "tab_professionaldevelopment";
        var professionalDevelopmentBPFAttributeName = "header_process_ecer_hasprofessionaldevelopment";
        var professionalDevelopmentApprovedBPFAttributeName = "header_process_ecer_professionaldevelopmentapproved";
        var professionalDevelopmentApprovedBPFAssessmentReviewAttributeName = "header_process_ecer_professionaldevelopmentapproved_1";
        var professionalDevelopmentApprovedAttributeName = "ecer_professionaldevelopmentapproved";
        crm_Utility.showHide(executionContext, show, "ecer_professionaldevelopmentreceived");
        crm_Utility.showHide(executionContext, show, "header_process_ecer_professionaldevelopmentreceived");
        crm_Utility.showHide(executionContext, show, professionalDevelopmentApprovedAttributeName);
        crm_Utility.showHide(executionContext, show, professionalDevelopmentBPFAttributeName);
        crm_Utility.showHide(executionContext, show, professionalDevelopmentApprovedBPFAttributeName);
        crm_Utility.showHide(executionContext, show, professionalDevelopmentApprovedBPFAssessmentReviewAttributeName);
        crm_Utility.showHide(executionContext, show, "header_process_ecer_professionaldevelopmentapproved_2");
        crm_Utility.showHide(executionContext, show, "header_process_ecer_professionaldevelopmentapproved_3");
        crm_Utility.showHide(executionContext, show, "header_process_ecer_professionaldevelopmentapproved_4");
        crm_Utility.showHide(executionContext, show, "ecer_addmoreprofessionaldevelopment");
        crm_Utility.showHide(executionContext, show, professionalDevelopmentTabName);
    },

    showHideEducationFieldsOnRenewals: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var typeAttributeName = "ecer_type";
        var isECEAssistantAttributeName = "ecer_iseceassistant";
        var typeAttribute = formContext.getAttribute(typeAttributeName);
        var isECEAssistantAttribute = formContext.getAttribute(isECEAssistantAttributeName);
        var isRenewal = typeAttribute != null && typeAttribute.getValue() !== null && typeAttribute.getValue() === 621870001;
        var isLaborMobility = typeAttribute != null && typeAttribute.getValue() !== null && typeAttribute.getValue() === 621870003;
        var isECEAssistant = isECEAssistantAttribute != null && isECEAssistantAttribute.getValue() != null && isECEAssistantAttribute.getValue() == true;

        var educationRecognitionAttributeName = "ecer_educationrecognition";
        var educationRecognitionValue = formContext.getAttribute(educationRecognitionAttributeName).getValue();
        var isNotRecognized = educationRecognitionValue === 621870001; // Not Recognized
        var isNew = typeAttribute != null && typeAttribute.getValue() != null && typeAttribute.getValue() == 621870000;
        var hideEducationTranscriptApprovedOnEquivalency = isNew && isNotRecognized;

        var show = (!isRenewal || isECEAssistant) && !isLaborMobility;
        var educationTranscriptTabName = "tab_educationinformation";
        var educationTranscriptReceivedBPFAttributeName = "header_process_ecer_transcriptreceived";
        var educationTranscriptApprovedBPFAttributeName = "header_process_ecer_educationtranscriptapproved";
        var educationTranscriptReceivedAttributeName = "ecer_transcriptreceived";
        var educationTranscriptReceivedDateAttributeName = "ecer_transcriptreceiveddate";
        var educationTranscriptApprovedAttributeName = "ecer_educationtranscriptapproved";
        var educationTranscriptApprovedBPF2ndAssessment = "header_process_ecer_educationtranscriptapproved_4";
        crm_Utility.showHide(executionContext, show, educationTranscriptReceivedBPFAttributeName);
        crm_Utility.showHide(executionContext, show && !hideEducationTranscriptApprovedOnEquivalency, educationTranscriptApprovedBPFAttributeName);
        crm_Utility.showHide(executionContext, show && !hideEducationTranscriptApprovedOnEquivalency, educationTranscriptApprovedBPF2ndAssessment);
        // Though I can't find it.  If there is 4, then there might be 1,2,3...
        crm_Utility.showHide(executionContext, show && !hideEducationTranscriptApprovedOnEquivalency, "header_process_ecer_educationtranscriptapproved_1");
        crm_Utility.showHide(executionContext, show && !hideEducationTranscriptApprovedOnEquivalency, "header_process_ecer_educationtranscriptapproved_2");
        crm_Utility.showHide(executionContext, show && !hideEducationTranscriptApprovedOnEquivalency, "header_process_ecer_educationtranscriptapproved_3");
        crm_Utility.showHide(executionContext, show, educationTranscriptReceivedAttributeName);
        crm_Utility.showHide(executionContext, show, educationTranscriptReceivedDateAttributeName);
        crm_Utility.showHide(executionContext, show && !hideEducationTranscriptApprovedOnEquivalency, educationTranscriptApprovedAttributeName);
        crm_Utility.showHide(executionContext, show, educationTranscriptTabName);
        crm_Utility.showHide(executionContext, show, "ecer_educationorigin");
        crm_Utility.showHide(executionContext, show, "ecer_educationrecognition");
        crm_Utility.showHide(executionContext, show, "header_process_ecer_educationorigin");
        crm_Utility.showHide(executionContext, show, "header_process_ecer_educationrecognition");

    },

    showHideEscalationFields: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var programSupportRole = crm_Utility.checkCurrentUserRole("Certification - Program Support Role");
        var programSupportLeadRole = crm_Utility.checkCurrentUserRole("Certification - Program Support Lead Role");
        var hasProgramClerkSecurityRole = programSupportLeadRole || programSupportRole;

        var typeAttributeName = "ecer_type";
        var typeAttribute = formContext.getAttribute(typeAttributeName);
        var isLaborMobility = typeAttribute != null && typeAttribute.getValue() !== null && typeAttribute.getValue() === 621870003;
        var isNew = typeAttribute != null && typeAttribute.getValue() != null && typeAttribute.getValue() == 621870000;
        var isRenewal = typeAttribute != null && typeAttribute.getValue() != null && typeAttribute.getValue() == 621870001;
        var educationRecognitionAttributeName = "ecer_educationrecognition";
        var educationRecognitionValue = formContext.getAttribute(educationRecognitionAttributeName).getValue();
        var isNotRecognized = educationRecognitionValue === 621870001; // Not Recognized
        var escalateToTeamLeadBPFSubmission = "header_process_ecer_escalatetoteamlead";
        var escalateToTeamLeadBPFAssessment = "header_process_ecer_escalatetoteamlead_2";
        crm_Utility.showHide(executionContext, !hasProgramClerkSecurityRole, escalateToTeamLeadBPFSubmission); // Submission BPF Stage // Common to all type
        crm_Utility.showHide(executionContext, !isLaborMobility, "header_process_ecer_educationorigin_2"); // Assessment BPF Stage
        crm_Utility.showHide(executionContext, !isLaborMobility, "header_process_ecer_educationrecognition_2");
        if (!hasProgramClerkSecurityRole) {
            return;
        }
        // Labor Mobility
        if (isLaborMobility) {
            var laborMobilityShow = false;
            var laborMobilityDisable = true;

            crm_Utility.showHide(executionContext, laborMobilityShow, "assessment:section_escalation");
            crm_Utility.enableDisable(executionContext, laborMobilityDisable, "header_process_ecer_workexperiencereferenceapproved_2"); // Assessment Work Exp Approved
            crm_Utility.enableDisable(executionContext, laborMobilityDisable, "header_process_ecer_characterreferenceapproved_2"); // Assessment Char Ref Approved
            crm_Utility.enableDisable(executionContext, laborMobilityDisable, escalateToTeamLeadBPFAssessment); // Assessment BPF Stage
            return;
        }

        if (isNew && isNotRecognized) // Equavalency
        {
            crm_Utility.enableDisable(executionContext, true, "header_process_ecer_escalatetoteamlead_1"); // Program Analyst BPF Stage

            return;
        }

        if (isNew && !isNotRecognized) { // Other New Applications
            crm_Utility.enableDisable(executionContext, true, escalateToTeamLeadBPFAssessment); // Assessment BPF Stage
            crm_Utility.enableDisable(executionContext, true, "header_process_ecer_escalatetoteamlead_1"); // Assessment BPF Stage
            crm_Utility.enableDisable(executionContext, true, "header_process_ecer_workexperiencereferenceapproved_2"); // Assessment Work Exp Approved
            crm_Utility.enableDisable(executionContext, true, "header_process_ecer_characterreferenceapproved_2"); // Assessment Char Ref Approved
            crm_Utility.enableDisable(executionContext, true, "header_process_ecer_educationtranscriptapproved_2"); // Assessment Transcript Approved
            return;
        }

        if (isRenewal) { // Renewals

            crm_Utility.enableDisable(executionContext, true, escalateToTeamLeadBPFAssessment); // Assessment BPF Stage
            crm_Utility.enableDisable(executionContext, true, "header_process_ecer_workexperiencereferenceapproved_2"); // Assessment Work Exp Approved
            crm_Utility.enableDisable(executionContext, true, "header_process_ecer_characterreferenceapproved_2"); // Assessment Char Ref Approved
            crm_Utility.enableDisable(executionContext, true, "header_process_ecer_educationtranscriptapproved_2"); // Assessment Transcript Approved
            return;
        }

    },

    showHideParentalGuidianceFieldsOnApplicantAge: function (executionContext) {
        var show = false;
        var formContext = executionContext.getFormContext();
        var applicantAgeAttribute = formContext.getAttribute("ecer_applicantage");
        var parentalReferenceReceivedBPFAttributeName = "header_process_ecer_parentalreferencereceived";
        var parentalReferenceApprovedBPFAttributeName = "header_process_ecer_parentalreferenceapproved";
        var parentalReferenceApprovedBPFAssessmentReviewStageAttributeName = "header_process_ecer_parentalreferenceapproved_1";
        var parentalReferenceApprovedBPF2ndAssessmentStageAttributeName = "header_process_ecer_parentalreferenceapproved_2";
        var parentalReferenceApprovedAttributeName = "ecer_parentalreferenceapproved";
        var parentalReferenceReceivedAttributeName = "ecer_parentalreferencereceived";
        var parentalReferenceReceivedDateAttributeName = "ecer_parentalreferencereceiveddate";
        if (applicantAgeAttribute != null && applicantAgeAttribute.getValue() != null && applicantAgeAttribute.getValue() < 19) {
            show = true;
        }
        // ECER-1501
        // Setting the BPF control to NOT Visible will also remove the Required Level of Requirement
        // Per https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/controls/setvisible
        crm_Utility.showHide(executionContext, show, parentalReferenceReceivedBPFAttributeName);
        crm_Utility.showHide(executionContext, show, parentalReferenceApprovedBPFAttributeName);
        crm_Utility.showHide(executionContext, show, parentalReferenceApprovedBPFAssessmentReviewStageAttributeName);
        crm_Utility.showHide(executionContext, show, parentalReferenceApprovedBPF2ndAssessmentStageAttributeName);
        crm_Utility.showHide(executionContext, show, "header_process_ecer_parentalreferenceapproved_3");
        crm_Utility.showHide(executionContext, show, "header_process_ecer_parentalreferenceapproved_4");
        crm_Utility.showHide(executionContext, show, parentalReferenceApprovedAttributeName);
        crm_Utility.showHide(executionContext, show, parentalReferenceReceivedAttributeName);
        crm_Utility.showHide(executionContext, show, parentalReferenceReceivedDateAttributeName);
    },

    certificateTypeFlagsValidation: function (executionContext) {
        // ECE Assistant and ECE 1 YR can only be selected by itself
        var formContext = executionContext.getFormContext();
        try {
            var isECEAssistantAttribute = formContext.getAttribute("ecer_iseceassistant");
            var isECE1YrAttribute = formContext.getAttribute("ecer_isece1yr");
            var isECE5YrAttribute = formContext.getAttribute("ecer_isece5yr");
            var isSNEAttribute = formContext.getAttribute("ecer_issne");
            var isITEAttribute = formContext.getAttribute("ecer_isite");

            var isECEAssistant = isECEAssistantAttribute.getValue();
            var isECE1Yr = isECE1YrAttribute.getValue();
            var isECE5Yr = isECE5YrAttribute.getValue();
            var isSNE = isSNEAttribute.getValue();
            var isITE = isITEAttribute.getValue();

            // ECER-3617.  Setting Value without triggering change seems to make the Toggle Button confuse.  Add 
            if (isECEAssistant == true && isECE1Yr == true) {
                crm_Utility.showMessage("ECE Assistant or ECE 1 Year cannot be selected if other Certificate Type(s) are already selected");
                formContext.getAttribute("ecer_iseceassistant").setValue(false);
                formContext.getAttribute("ecer_isece1yr").setValue(false);
                isECEAssistantAttribute.fireOnChange();
                isECE1YrAttribute.fireOnChange();
                return;
            }

            if (isECEAssistant == true &&
                (isECE5Yr == true || isSNE == true || isITE == true)) {
                crm_Utility.showMessage("ECE Assistant cannot be selected if other Certificate Type(s) are already selected");
                formContext.getAttribute("ecer_iseceassistant").setValue(false);
                isECEAssistantAttribute.fireOnChange();
                return;
            }

            if (isECE1Yr == true &&
                (isECE5Yr == true || isSNE == true || isITE == true)) {
                crm_Utility.showMessage("ECE 1 Year cannot be selected if other Certificate Type(s) are already selected");
                formContext.getAttribute("ecer_isece1yr").setValue(false);
                isECE1YrAttribute.fireOnChange();
                return;
            }

            var certificateTypeValue = "";

            if (isECE5Yr == true) {
                certificateTypeValue = ECER.Jscripts.Application.composeCertificateTypeValue(certificateTypeValue, "ECE 5 YR");
            }

            if (isSNE == true) {
                certificateTypeValue = ECER.Jscripts.Application.composeCertificateTypeValue(certificateTypeValue, "SNE");
            }

            if (isITE == true) {
                certificateTypeValue = ECER.Jscripts.Application.composeCertificateTypeValue(certificateTypeValue, "ITE");
            }

            if (isECE1Yr == true) {
                certificateTypeValue = ECER.Jscripts.Application.composeCertificateTypeValue(certificateTypeValue, "ECE 1 YR");
            }

            if (isECEAssistant == true) {
                certificateTypeValue = ECER.Jscripts.Application.composeCertificateTypeValue(certificateTypeValue, "ECE Assistant");
            }

            var certificateTypeAttribute = formContext.getAttribute("ecer_certificatetype")
            if (certificateTypeValue != null && certificateTypeValue != "") {
                certificateTypeAttribute.setValue(certificateTypeValue);
            }
            else {
                certificateTypeAttribute.setValue(null);
            }
            certificateTypeAttribute.fireOnChange();
        }
        catch (err) {
            crm_Utility.showMessage(err.message);
        }
    },

    composeCertificateTypeValue: function (existingValue, valueToBeAppended) {
        if (valueToBeAppended == null || valueToBeAppended.trim() === "") {
            return existingValue;
        }
        if (existingValue == null || existingValue.trim() === "") {
            existingValue = "";
        }
        else {
            existingValue += " ";
        }

        return existingValue += valueToBeAppended.trim();
    },

    onRequestMoreCharacterReferenceButton: function () {
        var executionContext = this.crm_ExecutionContext;
        var formContext = executionContext.getFormContext();
        try {
            var moreReferenceAttributeName = "ecer_requestcharacterreference";
            var requestReferenceAttribute = formContext.getAttribute(moreReferenceAttributeName);
            if (requestReferenceAttribute !== null) {
                var requestReferenceValue = requestReferenceAttribute.getValue();
                if (requestReferenceValue !== true) {
                    requestReferenceAttribute.setValue(true);
                    formContext.data.save();
                }
            }
        }
        catch (err) {
            crm_Utility.showMessage(err.message);
        }
    },

    onRequestMoreWorkExperienceReferenceButton: function () {
        var executionContext = this.crm_ExecutionContext;
        var formContext = executionContext.getFormContext();
        try {
            var moreReferenceAttributeName = "ecer_requestwkexpreference";
            var requestReferenceAttribute = formContext.getAttribute(moreReferenceAttributeName);
            if (requestReferenceAttribute !== null) {
                var requestReferenceValue = requestReferenceAttribute.getValue();
                if (requestReferenceValue !== true) {
                    requestReferenceAttribute.setValue(true);
                    formContext.data.save();
                }
            }
        }
        catch (err) {
            crm_Utility.showMessage(err.message);
        }
    },

    onProfileCreationButton: function () {
        // Directive to prevent use of undeclared variables
        var executionContext = this.crm_ExecutionContext;
        var formContext = executionContext.getFormContext();
        try {
            var applicantAttribute = formContext.getAttribute("ecer_applicantid");
            if (applicantAttribute != null && applicantAttribute.getValue() != null) {
                // Prompt message
                var msgTitle = "Applicant Lookup already contains data";
                var errMsg = "Applicant Lookup already contains data.  Please verify and try again";
                var alertStrings = { confirmButtonLabel: "OK", text: errMsg, title: msgTitle };
                var alertOptions = { height: 240, width: 360 };
                Xrm.Navigation.openAlertDialog(alertStrings, alertOptions);
                return;
            }

            var lastName = formContext.getAttribute("ecer_legallastname").getValue();
            var firstName = formContext.getAttribute("ecer_legalfirstname").getValue();
            var middleName = formContext.getAttribute("ecer_legalmiddlename").getValue();
            var preferredname = formContext.getAttribute("ecer_preferredname").getValue();
            var stree1 = formContext.getAttribute("ecer_street").getValue();
            var city = formContext.getAttribute("ecer_city").getValue();
            var province = formContext.getAttribute("ecer_province").getValue();
            var postalCode = formContext.getAttribute("ecer_postalcode").getValue();
            var country = formContext.getAttribute("ecer_country").getValue();
            var email = formContext.getAttribute("ecer_emailaddress").getValue();
            var primaryPhone = formContext.getAttribute("ecer_primaryphonenumber").getValue();
            var mobilePhone = formContext.getAttribute("ecer_alternatephonenumber").getValue();
            var dob = formContext.getAttribute("ecer_dateofbirth").getValue();

            var entity = {};
            entity.firstname = firstName;
            entity.lastname = lastName;
            entity.middlename = middleName;
            entity.ecer_preferredname = preferredname;
            entity.address1_line1 = stree1;
            entity.address1_city = city;
            entity.address1_stateorprovince = province;
            entity.address1_country = country;
            entity.address1_postalcode = postalCode;
            entity.emailaddress1 = email;
            entity.telephone1 = primaryPhone;
            entity.mobilephone = mobilePhone;
            if (dob !== null) {
                // Date Only Date Only field will only take short date yyyy-MM-dd
                var year = dob.getFullYear();
                var month = dob.getMonth() + 1;
                var day = dob.getDate();
                var dateString = year.toString() + "-" + month.toString() + "-" + day.toString();
                entity.birthdate = dateString;
            }
            // record created from application will be BC ECE applicant
            entity.ecer_isbcece = true;

            Xrm.WebApi.online.createRecord("contact", entity).then(
                function success(result) {
                    var entityRecordId = result.id;
                    var entityRecordName = firstName + " " + lastName;

                    var lookupArray = new Array();
                    lookupArray[0] = new Object();
                    // Treat the entity record to include curly braces if needed
                    if (entityRecordId.indexOf("{") === -1) {
                        entityRecordId = "{" + entityRecordId + "}";
                    }
                    lookupArray[0].id = entityRecordId;
                    lookupArray[0].name = entityRecordName;
                    lookupArray[0].entityType = "contact";
                    applicantAttribute.setValue(lookupArray);
                    formContext.data.save();
                    ECER.Jscripts.Application.showHideApplicantQuickView(executionContext);

                },
                function fail(error) {
                    crm_Utility.showMessage(error.message);
                }
            );
        }
        catch (err) {
            crm_Utility.showMessage(err.message);
        }
    },

    onProfileSearchButton: function () {
        // Directive to prevent use of undeclared variables
        var executionContext = this.crm_ExecutionContext;
        var formContext = executionContext.getFormContext();
        try {

            var applicantAttribute = formContext.getAttribute("ecer_applicantid");
            if (applicantAttribute != null && applicantAttribute.getValue() != null) {
                // Prompt message
                var msgTitle = "Applicant Lookup already contains data";
                var errMsg = "Applicant Lookup already contains data.  Please verify and try again";
                var alertStrings = { confirmButtonLabel: "OK", text: errMsg, title: msgTitle };
                var alertOptions = { height: 240, width: 360 };
                Xrm.Navigation.openAlertDialog(alertStrings, alertOptions);
                return;
            }

            var currentCertificateNumberAttribute = formContext.getAttribute("ecer_currentcertificationnumber");
            if (currentCertificateNumberAttribute == null || currentCertificateNumberAttribute.getValue() == null || currentCertificateNumberAttribute.getValue().trim() == '') {
                // Prompt message
                var msgTitle = "Current Certificate Number does not contains data";
                var errMsg = "Current Certificate Number does not contains data.  Please verify and try again";
                var alertStrings = { confirmButtonLabel: "OK", text: errMsg, title: msgTitle };
                var alertOptions = { height: 240, width: 360 };
                Xrm.Navigation.openAlertDialog(alertStrings, alertOptions);
                return;
            }
            var currentCertificateNumber = currentCertificateNumberAttribute.getValue().trim();

            var option = "?$filter=ecer_clientid eq '" + currentCertificateNumber + "'";
            Xrm.WebApi.retrieveMultipleRecords("contact", option).then(
                function success(results) {
                    if (results.entities.length == 0) {
                        // Prompt message
                        var msgTitle = "No matching Registrant is found in system";
                        var errMsg = "No matching Registrant with Certificate #" + currentCertificateNumber + " is found.  Please verify and try again";
                        var alertStrings = { confirmButtonLabel: "OK", text: errMsg, title: msgTitle };
                        var alertOptions = { height: 240, width: 360 };
                        Xrm.Navigation.openAlertDialog(alertStrings, alertOptions);
                    }
                    else {
                        var lastNameFromRecord = results.entities[0].lastname;
                        var firstNameFromRecord = results.entities[0].firstname;
                        var middleNameFromRecord = results.entities[0].middlename;
                        var preferredNameFromRecord = results.entities[0].ecer_preferredname;
                        var street1FromRecord = results.entities[0].address1_line1;
                        var cityFromRecord = results.entities[0].address1_city;
                        var provinceFromRecord = results.entities[0].address1_stateorprovince;
                        var postalcodeFromRecord = results.entities[0].address1_postalcode
                        var countryFromRecord = results.entities[0].address1_country;
                        var emailFromRecord = results.entities[0].emailaddress1;
                        var primaryPhoneFromRecord = results.entities[0].telephone1;
                        var mobilePhoneFromRecord = results.entities[0].mobilephone;

                        var entityRecordId = results.entities[0].contactid;
                        var entityRecordName = results.entities[0].fullname;

                        var lastName = formContext.getAttribute("ecer_legallastname").getValue();
                        var firstName = formContext.getAttribute("ecer_legalfirstname").getValue();
                        var middleName = formContext.getAttribute("ecer_legalmiddlename").getValue();
                        var preferredname = formContext.getAttribute("ecer_preferredname").getValue();
                        var stree1 = formContext.getAttribute("ecer_street").getValue();
                        var city = formContext.getAttribute("ecer_city").getValue();
                        var province = formContext.getAttribute("ecer_province").getValue();
                        var postalCode = formContext.getAttribute("ecer_postalcode").getValue();
                        var country = formContext.getAttribute("ecer_country").getValue();
                        var email = formContext.getAttribute("ecer_emailaddress").getValue();
                        var primaryPhone = formContext.getAttribute("ecer_primaryphonenumber").getValue();
                        var mobilePhone = formContext.getAttribute("ecer_alternatephonenumber").getValue();

                        var totalMatch = lastNameFromRecord == lastName &&
                            firstNameFromRecord == firstName &&
                            middleNameFromRecord == middleName &&
                            preferredname == preferredNameFromRecord &&
                            stree1 == street1FromRecord &&
                            city == cityFromRecord &&
                            province == provinceFromRecord &&
                            postalCode == postalcodeFromRecord &&
                            country == countryFromRecord &&
                            email == emailFromRecord &&
                            primaryPhone == primaryPhoneFromRecord &&
                            mobilePhone == mobilePhoneFromRecord;

                        if (totalMatch) {
                            var lookupArray = new Array();
                            lookupArray[0] = new Object();
                            // Treat the entity record to include curly braces if needed
                            if (entityRecordId.indexOf("{") === -1) {
                                entityRecordId = "{" + entityRecordId + "}";
                            }
                            lookupArray[0].id = entityRecordId;
                            lookupArray[0].name = entityRecordName;
                            lookupArray[0].entityType = "contact";
                            applicantAttribute.setValue(lookupArray);
                            formContext.data.save();
                            ECER.Jscripts.Application.showHideApplicantQuickView(executionContext);
                            return; // Exit upon setting lookup with the contact record.
                        }

                        // Not Exact Match in details.  Do we still want to use this lookup?
                        var msg = "Certificate #: " + currentCertificateNumber + " profile found is not matching 100%" +
                            "\nRecord found from system\n\n" +
                            "\nFirst Name: " + firstNameFromRecord +
                            "\nMiddle Name: " + middleNameFromRecord +
                            "\nLast Name: " + lastNameFromRecord +
                            "\nAddress: " + street1FromRecord +
                            "\nCity: " + cityFromRecord +
                            "\nProvince: " + provinceFromRecord +
                            "\nPostal Code: " + postalcodeFromRecord +
                            "\nCountry: " + countryFromRecord +
                            "\nEmail: " + emailFromRecord +
                            "\nPrimary Phone: " + primaryPhoneFromRecord +
                            "\nMobile Phone: " + mobilePhoneFromRecord +
                            "\n\nClick Confirm to use found result.";;
                        var msgTitle = "Confirm Profile Information";

                        var confirmStrings = { confirmButtonLabel: "Confirm", cancelButtonLabel: "Cancel", text: msg, title: msgTitle };
                        var confirmOptions = { height: 640, width: 480 };
                        Xrm.Navigation.openConfirmDialog(confirmStrings, confirmOptions).then(
                            function (success) {
                                if (success.confirmed) {

                                    var lookupArray = new Array();
                                    lookupArray[0] = new Object();
                                    // Treat the entity record to include curly braces if needed
                                    if (entityRecordId.indexOf("{") === -1) {
                                        entityRecordId = "{" + entityRecordId + "}";
                                    }
                                    lookupArray[0].id = entityRecordId;
                                    lookupArray[0].name = entityRecordName;
                                    lookupArray[0].entityType = "contact";
                                    applicantAttribute.setValue(lookupArray);
                                    formContext.data.save();
                                    ECER.Jscripts.Application.showHideApplicantQuickView(executionContext);
                                }
                            }
                        );
                    }
                }
            );
        }
        catch (err) {
            throw new Error(err.message);
        }
    }
}