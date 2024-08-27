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
        ECER.Jscripts.Application.showHide1YRExplanationChoice(executionContext);
    },

    showHide1YRExplanationChoice: function (executionContext) {
        // ECER-2022
        // For 1 Year Renewal, applicant needs to submit an Explanation Letter 
        // if Work Experience Hours have not met the minimum requirement.
        // Show the field at Application form when criteria are met
        var formContext = executionContext.getFormContext();
        var typeAttributeName = "ecer_type";
        var isECE1YrAttributeName = "ecer_isece1yr";
        var totalAnticipatedHoursAttributeName = "ecer_totalanticipatedworkexperiencehours";
        var totalObservedHoursAttributeName = "ecer_totalobservedworkexperiencehours";
        var totalApprovedHoursAttributeName = "ecer_totalapprovedworkexperiencehours";
        var oneYearExplanationAttributeName = "ecer_1yrexplanationchoice";

        var anticipatedHours = 0.0;
        var observedHours = 0.0;
        var approvedHours = 0.0;

        var typeAttribute = formContext.getAttribute(typeAttributeName);
        var isRenewal = typeAttribute != null && typeAttribute.getValue() != null && typeAttribute.getValue() == 621870001;

        var oneYearExplanationValue = formContext.getAttribute(oneYearExplanationAttributeName).getValue();
        var isECE1Yr = formContext.getAttribute(isECE1YrAttributeName).getValue();
        if (formContext.getAttribute(totalAnticipatedHoursAttributeName) != null &&
            formContext.getAttribute(totalAnticipatedHoursAttributeName).getValue() != null) {
            anticipatedHours = formContext.getAttribute(totalAnticipatedHoursAttributeName).getValue();
        }
        if (formContext.getAttribute(totalObservedHoursAttributeName) != null &&
            formContext.getAttribute(totalObservedHoursAttributeName).getValue() != null) {
            observedHours = formContext.getAttribute(totalObservedHoursAttributeName).getValue();
        }
        if (formContext.getAttribute(totalApprovedHoursAttributeName) != null &&
            formContext.getAttribute(totalApprovedHoursAttributeName).getValue() != null) {
            approvedHours = formContext.getAttribute(totalApprovedHoursAttributeName).getValue();
        }
        var totalHours = anticipatedHours + observedHours + approvedHours;
        var show = (isECE1Yr && isRenewal && (totalHours < 500)) || (oneYearExplanationValue != null);
        crm_Utility.showHide(executionContext, show, oneYearExplanationAttributeName);
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
        var assessorRole = crm_Utility.checkCurrentUserRole("Certification - Assessor Role");
        var managerOfCertificationRole = crm_Utility.checkCurrentUserRole("Certifications - Manager of Certifications Role");
        var assessorTeamLeadRole = crm_Utility.checkCurrentUserRole("Certification - Team Lead Role");
        var programSupportRole = crm_Utility.checkCurrentUserRole("Certification - Program Support Role");
        var programSupportLeadRole = crm_Utility.checkCurrentUserRole("Certification - Program Support Lead Role");
        var operationSupervisorRole = crm_Utility.checkCurrentUserRole("Certification - Operations Supervisor Assessment Role");
        var investigatorRole = crm_Utility.checkCurrentUserRole("Investigation - Investigator");
        var sysAdminRole = crm_Utility.checkCurrentUserRole("System Administrator");
        var alwaysOpen = !(sysAdminRole || assessorRole || assessorTeamLeadRole || programSupportRole ||
            programSupportLeadRole || operationSupervisorRole || investigatorRole);
        var formContext = executionContext.getFormContext();

        // Application Information Tab - General
        formContext.getControl("ecer_type").setDisabled(!sysAdminRole);
        formContext.getControl("ecer_educationorigin").setDisabled(!(sysAdminRole || assessorRole ||
            assessorTeamLeadRole || operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("ecer_educationrecognition").setDisabled(!(sysAdminRole || assessorRole ||
            assessorTeamLeadRole || operationSupervisorRole || managerOfCertificationRole || investigatorRole));

        // Application Information Tab - Certificate Type(s)
        formContext.getControl("ecer_iseceassistant").setDisabled(!(sysAdminRole || assessorRole ||
            assessorTeamLeadRole || operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("ecer_isece1yr").setDisabled(!(sysAdminRole || assessorRole ||
            assessorTeamLeadRole || operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("ecer_isece5yr").setDisabled(!(sysAdminRole || assessorRole ||
            assessorTeamLeadRole || operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("ecer_isite").setDisabled(!(sysAdminRole || assessorRole ||
            assessorTeamLeadRole || operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("ecer_issne").setDisabled(!(sysAdminRole || assessorRole ||
            assessorTeamLeadRole || operationSupervisorRole || managerOfCertificationRole || investigatorRole));

        // Application Information Tab - Applicant
        formContext.getControl("ecer_applicantid").setDisabled(!(programSupportRole || programSupportLeadRole || 
            operationSupervisorRole || managerOfCertificationRole || investigatorRole || sysAdminRole));

        // Application Information Tab - Contact Names - Manual Application
        // All Enable - By Form Configurations

        // Application Information Tab - Applicant Address - Manual Application
        // All Enable - By Form Configurations

        // Completeness Review Tab - Confirm Information Received (Internal Use)
        formContext.getControl("ecer_characterreferencereceived").setDisabled(!sysAdminRole);
        formContext.getControl("ecer_characterreferencereceiveddate").setDisabled(!sysAdminRole);
        formContext.getControl("ecer_workexperiencereceived").setDisabled(!sysAdminRole);
        formContext.getControl("ecer_workexperiencereceiveddate").setDisabled(!sysAdminRole);
        formContext.getControl("ecer_transcriptreceived").setDisabled(!(sysAdminRole || programSupportRole || programSupportLeadRole));
        formContext.getControl("ecer_transcriptreceiveddate").setDisabled(!sysAdminRole);
        formContext.getControl("ecer_parentalreferencereceived").setDisabled(!sysAdminRole);
        formContext.getControl("ecer_parentalreferencereceiveddate").setDisabled(!sysAdminRole);
        formContext.getControl("ecer_hasprofessionaldevelopment").setDisabled(!sysAdminRole);
        formContext.getControl("ecer_professionaldevelopmentreceived").setDisabled(!sysAdminRole);
        formContext.getControl("ecer_parentalreferencereceiveddate").setDisabled(!sysAdminRole);

        // Completeness Review Tab - Ready for Assessment
        formContext.getControl("ecer_readyforassessment").setDisabled(alwaysOpen); // Always open
        formContext.getControl("ecer_readyforassessmentdate").setDisabled(!sysAdminRole);

        // Completeness Review Tab - Request More References (These allow Portal User to upload more references)
        formContext.getControl("ecer_addmorecharacterreference").setDisabled(!sysAdminRole); // Always open
        formContext.getControl("ecer_addmoreworkexperiencereference").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));

        // Assessment Tab - Application Assessment
        formContext.getControl("ecer_workexperiencereferenceapproved").setDisabled(!(sysAdminRole || assessorRole ||
            assessorTeamLeadRole || operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("ecer_characterreferenceapproved").setDisabled(!(sysAdminRole || assessorRole ||
            assessorTeamLeadRole || operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("ecer_parentalreferenceapproved").setDisabled(!(sysAdminRole || assessorRole ||
            assessorTeamLeadRole || operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("ecer_educationtranscriptapproved").setDisabled(!(sysAdminRole || assessorRole ||
            assessorTeamLeadRole || operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("ecer_professionaldevelopmentapproved").setDisabled(!(sysAdminRole || assessorRole ||
            assessorTeamLeadRole || operationSupervisorRole || managerOfCertificationRole || investigatorRole));

        // Assessment Tab - Work Experience Assessment TBD
        formContext.getControl("ecer_hasprovided500hoursworkexperience").setDisabled(!(sysAdminRole || assessorRole ||
            assessorTeamLeadRole || operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("ecer_hasprovided400hoursworkexperience").setDisabled(!(sysAdminRole || assessorRole ||
            assessorTeamLeadRole || operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("ecer_explanationletter").setDisabled(!(sysAdminRole || assessorRole ||
            assessorTeamLeadRole || operationSupervisorRole || managerOfCertificationRole || investigatorRole));

        // Assessment Tab - Application Decision
        formContext.getControl("statuscode").setDisabled(alwaysOpen); // always open
        formContext.getControl("ecer_statusreasondetail").setDisabled(alwaysOpen);
        formContext.getControl("ecer_generatecertificaterecord").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("ecer_certificateid").setDisabled(true);
        formContext.getControl("ecer_denialreasontype").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("ecer_denialreasonexplanation").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("ecer_printrequest").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("ecer_appealperiodenddate").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));

        // Assessment Tab - Escalation
        formContext.getControl("ecer_escalatetoteamlead").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole));
        formContext.getControl("ecer_dateescalated").setDisabled(!sysAdminRole); 
        formContext.getControl("ecer_escalatereason").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole));

        // Declaration Tab - Declaration and Consent
        // Locked by Form Configurations

        // Work Experience Reference Tab
        // Total Anticipated, Observed, Approved hours locked by Form Configuration

        // BPF - Submission Stage
        formContext.getControl("header_process_ecer_isprimaryidentificationprovided").setDisabled(!(sysAdminRole || programSupportRole || programSupportLeadRole || investigatorRole));
        formContext.getControl("header_process_ecer_issecondaryidentificationprovided").setDisabled(!(sysAdminRole || programSupportRole || programSupportLeadRole || investigatorRole));
        formContext.getControl("header_process_ecer_applicantid").setDisabled(!(sysAdminRole || programSupportRole || programSupportLeadRole || investigatorRole));
        formContext.getControl("header_process_ecer_characterreferencereceived").setDisabled(!sysAdminRole);
        formContext.getControl("header_process_ecer_professionaldevelopmentreceived").setDisabled(!sysAdminRole);
        formContext.getControl("header_process_ecer_workexperiencereceived").setDisabled(!sysAdminRole);
        formContext.getControl("header_process_ecer_transcriptreceived").setDisabled(!(sysAdminRole || programSupportRole || programSupportLeadRole || investigatorRole));
        formContext.getControl("header_process_ecer_parentalreferencereceived").setDisabled(!sysAdminRole);
        formContext.getControl("header_process_ecer_hasprofessionaldevelopment").setDisabled(!sysAdminRole);
        formContext.getControl("header_process_ecer_readyforassessment").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole || programSupportRole ||
            programSupportLeadRole || operationSupervisorRole));

        // BPF - Assessment Stage
        formContext.getControl("header_process_statuscode").setDisabled(alwaysOpen);
        formContext.getControl("header_process_ecer_type").setDisabled(!sysAdminRole);
        formContext.getControl("header_process_ecer_educationorigin").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("header_process_ecer_educationrecognition").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("header_process_ecer_workexperiencereferenceapproved").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("header_process_ecer_characterreferenceapproved").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("header_process_ecer_parentalreferenceapproved").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("header_process_ecer_educationtranscriptapproved").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("header_process_ecer_professionaldevelopmentapproved").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("header_process_ecer_escalatetoteamlead").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("header_process_ecer_escalatereason").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));

        // BPF - Assessment Review Stage
        formContext.getControl("header_process_ecer_workexperiencereferenceapproved_3").setDisabled(!(sysAdminRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("header_process_ecer_characterreferenceapproved_3").setDisabled(!(sysAdminRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("header_process_ecer_parentalreferenceapproved_1").setDisabled(!(sysAdminRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("header_process_ecer_educationtranscriptapproved_3").setDisabled(!(sysAdminRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("header_process_ecer_professionaldevelopmentapproved_1").setDisabled(!(sysAdminRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("header_process_ecer_routetoassessmentteam_1").setDisabled(!(sysAdminRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));

        // BPF - Assessment Stage after pass back to Assessor
        formContext.getControl("header_process_statuscode_2").setDisabled(alwaysOpen);
        formContext.getControl("header_process_ecer_type_2").setDisabled(!sysAdminRole);
        formContext.getControl("header_process_ecer_educationorigin_2").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("header_process_ecer_educationrecognition_2").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("header_process_ecer_workexperiencereferenceapproved_4").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("header_process_ecer_characterreferenceapproved_4").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("header_process_ecer_parentalreferenceapproved_2").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("header_process_ecer_educationtranscriptapproved_4").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));
        formContext.getControl("header_process_ecer_professionaldevelopmentapproved_2").setDisabled(!(sysAdminRole || assessorRole || assessorTeamLeadRole ||
            operationSupervisorRole || managerOfCertificationRole || investigatorRole));

        // BPF - Complete Stage
        formContext.getControl("header_process_ecer_certificateid_3").setDisabled(!sysAdminRole);
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
        var typeAttribute = formContext.getAttribute(typeAttributeName);
        var isECEAssistantAttribute = formContext.getAttribute(isECEAssistantAttributeName);
        var isRenewal = typeAttribute != null && typeAttribute.getValue() != null && typeAttribute.getValue() == 621870001;
        var isECEAssistant = isECEAssistantAttribute != null && isECEAssistantAttribute.getValue() != null && isECEAssistantAttribute.getValue() == true;
        var show = isRenewal && !isECEAssistant;
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
        crm_Utility.showHide(executionContext, show, professionalDevelopmentTabName);
    },

    showHideEducationFieldsOnRenewals: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var typeAttributeName = "ecer_type";
        var isECEAssistantAttributeName = "ecer_iseceassistant";
        var typeAttribute = formContext.getAttribute(typeAttributeName);
        var isECEAssistantAttribute = formContext.getAttribute(isECEAssistantAttributeName);
        var isRenewal = typeAttribute != null && typeAttribute.getValue() != null && typeAttribute.getValue() == 621870001;
        var isECEAssistant = isECEAssistantAttribute != null && isECEAssistantAttribute.getValue() != null && isECEAssistantAttribute.getValue() == true;
        var show = !isRenewal || isECEAssistant;
        var educationTranscriptTabName = "tab_educationinformation";
        var educationTranscriptReceivedBPFAttributeName = "header_process_ecer_transcriptreceived";
        var educationTranscriptApprovedBPFAttributeName = "header_process_ecer_educationtranscriptapproved";
        var educationTranscriptReceivedAttributeName = "ecer_transcriptreceived";
        var educationTranscriptReceivedDateAttributeName = "ecer_transcriptreceiveddate";
        var educationTranscriptApprovedAttributeName = "ecer_educationtranscriptapproved";
        var educationTranscriptApprovedBPF2ndAssessment = "header_process_ecer_educationtranscriptapproved_4";
        crm_Utility.showHide(executionContext, show, educationTranscriptReceivedBPFAttributeName);
        crm_Utility.showHide(executionContext, show, educationTranscriptApprovedBPFAttributeName);
        crm_Utility.showHide(executionContext, show, educationTranscriptApprovedBPF2ndAssessment);
        // Though I can't find it.  If there is 4, then there might be 1,2,3...
        crm_Utility.showHide(executionContext, show, "header_process_ecer_educationtranscriptapproved_1");
        crm_Utility.showHide(executionContext, show, "header_process_ecer_educationtranscriptapproved_2");
        crm_Utility.showHide(executionContext, show, "header_process_ecer_educationtranscriptapproved_3");
        crm_Utility.showHide(executionContext, show, educationTranscriptReceivedAttributeName);
        crm_Utility.showHide(executionContext, show, educationTranscriptReceivedDateAttributeName);
        crm_Utility.showHide(executionContext, show, educationTranscriptApprovedAttributeName);
        crm_Utility.showHide(executionContext, show, educationTranscriptTabName);
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
            var isECEAssistant = formContext.getAttribute("ecer_iseceassistant").getValue();
            var isECE1Yr = formContext.getAttribute("ecer_isece1yr").getValue();
            var isECE5Yr = formContext.getAttribute("ecer_isece5yr").getValue();
            var isSNE = formContext.getAttribute("ecer_issne").getValue();
            var isITE = formContext.getAttribute("ecer_isite").getValue();

            if (isECEAssistant == true && isECE1Yr == true) {
                crm_Utility.showMessage("ECE Assistant or ECE 1 Year cannot be selected if other Certificate Type(s) are already selected");
                formContext.getAttribute("ecer_iseceassistant").setValue(false);
                formContext.getAttribute("ecer_isece1yr").setValue(false);
                return;
            }

            if (isECEAssistant == true &&
                (isECE5Yr == true || isSNE == true || isITE == true)) {
                crm_Utility.showMessage("ECE Assistant cannot be selected if other Certificate Type(s) are already selected");
                formContext.getAttribute("ecer_iseceassistant").setValue(false);
                return;
            }

            if (isECE1Yr == true &&
                (isECE5Yr == true || isSNE == true || isITE == true)) {
                crm_Utility.showMessage("ECE 1 Year cannot be selected if other Certificate Type(s) are already selected");
                formContext.getAttribute("ecer_isece1yr").setValue(false);
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

            if (certificateTypeValue != null && certificateTypeValue != "") {
                formContext.getAttribute("ecer_certificatetype").setValue(certificateTypeValue);
            }
            else {
                formContext.getAttribute("ecer_certificatetype").setValue(null);
            }
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
            existingValue += ", ";
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