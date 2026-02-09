// Javascript source code

if (typeof ECER === "undefined") {
    var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {}
}

ECER.Jscripts.ApplicationAssessments = {
    onLoad: function (executionContext) {
        this.crm_ExecutionContext = executionContext;
        //ECER.Jscripts.ApplicationAssessments.populateCharacterReferenceLookupIfEmpty(executionContext);
        ECER.Jscripts.ApplicationAssessments.showHideProfessionalDevelopment(executionContext);
        ECER.Jscripts.ApplicationAssessments.showCorrespondingEducationAssessmentGrid(executionContext);
    },

    showCorrespondingEducationAssessmentGrid: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var applicationAttribute = formContext.getAttribute("ecer_applicationid");
        if (applicationAttribute === null || applicationAttribute.getValue() === null) {
            return;
        }
        var applicationId = applicationAttribute.getValue()[0].id;
        Xrm.WebApi.retrieveRecord("ecer_application", applicationId).then(
            function success(record) {
                var isECEAssistant = record.ecer_iseceassistant;
                // Per ECER-5550
                // Assistant Certification only need 1 course of the 3 Areas of Instruction and do not need to meet minimal hours
                // Hence a different grid without the Areas of Instruction Minimal Hours is used

                crm_Utility.showHide(executionContext, isECEAssistant, "subgrid_educationassessmentsforassistant");
                crm_Utility.showHide(executionContext, !isECEAssistant, "subgrid_educationassessments");
            }
        );
        
    },

    showHideProfessionalDevelopment: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var applicationAttribute = formContext.getAttribute("ecer_applicationid");
        if (applicationAttribute === null || applicationAttribute.getValue() === null) {
            return;
        }
        var applicationId = applicationAttribute.getValue()[0].id;
        Xrm.WebApi.retrieveRecord("ecer_application", applicationId).then(
            function success(record) {
                var isRenewal = record.ecer_type == 621870001;
                var isECEAssistant = record.ecer_iseceassistant;
                // Per ECER-4128
                // Professional Development is only required for ECE 1 YR renewal
                // when the previous certificate has already expired and has expired less than 5 years.
                var isECE1YR = record.ecer_ecer_isece1yr;
                var renewalsLateInYears = record.ecer_renewalslateinyears;
                if (renewalsLateInYears == null) {
                    renewalsLateInYears = 0;
                }
                var is1YrRenewalsLateButLessThan5Yrs = isRenewal && isECE1YR && renewalLateInYears > 0 && renewalLateInYears < 5;
                var isRenewalsButNotECE1Yr = isRenewal && !isECE1YR;
                var showProfessionalDevelopment = (is1YrRenewalsLateButLessThan5Yrs || isRenewalsButNotECE1Yr) && !isECEAssistant;
                crm_Utility.showHide(executionContext, showProfessionalDevelopment, "tab_pdassessment");
                crm_Utility.showHide(executionContext, !showProfessionalDevelopment, "tab_educationassessment");
            }
        );
    },

    populateCharacterReferenceLookupIfEmpty: function (executionContext) {
        // ECER-2246
        var formContext = executionContext.getFormContext();

        var characterReferenceAttribute = formContext.getAttribute("ecer_characterreferencereviewedid");
        if (characterReferenceAttribute !== null && characterReferenceAttribute.getValue() !== null) {
            return; // Only populating if there is NULL value
        }

        var applicationAttribute = formContext.getAttribute("ecer_applicationid");
        if (applicationAttribute === null || applicationAttribute.getValue() === null) {
            return;
        }

        var applicationId = applicationAttribute.getValue()[0].id.toLowerCase().replace("{", "").replace("}", "");
        // Character Reference of the Application that is NOT DRAFT, NOT Application Submitted, and NOT Rejected
        var option = "?$filter=_ecer_applicationid_value eq '" + applicationId + "' and statuscode ne 1 and statuscode ne 621870006 and statuscode ne 621870005";
        Xrm.WebApi.retrieveMultipleRecords("ecer_characterreference", option).then(
            function success(results) {
                if (results.entities.length > 0) {
                    var entityRecordId = results.entities[0].ecer_characterreferenceid;
                    var entityRecordName = results.entities[0].ecer_name;
                    var lookupArray = new Array();
                    lookupArray[0] = new Object();
                    // Treat the entity record to include curly braces if needed
                    if (entityRecordId.indexOf("{") === -1) {
                        entityRecordId = "{" + entityRecordId + "}";
                    }
                    lookupArray[0].id = entityRecordId;
                    lookupArray[0].name = entityRecordName;
                    lookupArray[0].entityType = "ecer_characterreference";
                    characterReferenceAttribute.setValue(lookupArray);
                }
            }
        );
    },

    characterReferenceGridOnRecordSelect: function (executionContext) {
        // ECER-4021
        // To set the 
        // ECER.Jscripts.ApplicationAssessments.characterReferenceGridOnRecordSelect
        //verify if current user is same and current date is same day otherwise make row read only. Ignore if row is already inactive.
        if (!executionContext) {
            console.error("Execution context is not defined.");
            return;
        }

        var formContext = this.crm_ExecutionContext.getFormContext();
        var thisExecutionContext = this.crm_ExecutionContext;

        var characterReferenceAttribute = formContext.getAttribute("ecer_characterreferencereviewedid");
        if (characterReferenceAttribute === null) {
            return; // Only populating if there is Character Reference Lookup
        }

        var gridContext = executionContext.getFormContext();
        var selectedRow = gridContext.data.entity;
        var id = selectedRow.getId();

        if (id !== null) {
            id = id.replace("{", "").replace("}", "");
            Xrm.WebApi.retrieveRecord("ecer_characterreference", id).then(
                function success(results) {
                    var showSection = false;
                    if (results != null) {
                        var entityRecordId = results.ecer_characterreferenceid;
                        var entityRecordName = results.ecer_name;
                        var refFirstName = results.ecer_firstname;
                        var refLastName = results.ecer_lastname;
                        var name = refFirstName;
                        if (refFirstName == null) {
                            name = "";
                        }
                        else {
                            name += " ";
                        }
                        name += refLastName;
                        var lookupArray = new Array();
                        lookupArray[0] = new Object();
                        // Treat the entity record to include curly braces if needed
                        if (entityRecordId.indexOf("{") === -1) {
                            entityRecordId = "{" + entityRecordId + "}";
                        }
                        lookupArray[0].id = entityRecordId;
                        lookupArray[0].name = name;
                        lookupArray[0].entityType = "ecer_characterreference";
                        characterReferenceAttribute.setValue(lookupArray);
                        showSection = true;
                    }
                    crm_Utility.showHide(thisExecutionContext, showSection, "tab_characterreferenceassessment:section_reviewcharacterreference");
                }
            );
        }
        crm_Utility.DisableSubgridControls(executionContext);
    },
}


