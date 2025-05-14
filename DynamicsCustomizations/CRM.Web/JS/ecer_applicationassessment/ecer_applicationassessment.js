﻿// Javascript source code

if (typeof ECER === "undefined") {
    var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {}
}

ECER.Jscripts.ApplicationAssessments = {
    onLoad: function (executionContext) {
        ECER.Jscripts.ApplicationAssessments.populateCharacterReferenceLookupIfEmpty(executionContext);
        ECER.Jscripts.ApplicationAssessments.showHideProfessionalDevelopment(executionContext);
        ECER.Jscripts.ApplicationAssessments.showHideLabourMobilityTab(executionContext);

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

    characterReferenceGridPreFilter: function (executionContext) {
        // Reference: https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/clientapi/reference/controls/addcustomfilter
        // ECER-2246
        // Leave the method here.  Doesn't really need a subgrid as a prefilter medium
        // Just used a Pre-Filter Lookup
        var formContext = executionContext.getFormContext();
        var applicationAttribute = formContext.getAttribute("ecer_applicationid");
        if (applicationAttribute === null || applicationAttribute.getValue() === null) {
            return;
        }

        var applicationId = applicationAttribute.getValue()[0].id.toLowerCase().replace("{", "").replace("}", "");

        var fetchXML = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
            "<entity name = 'ecer_characterreference'>" +
            "<attribute name='ecer_characterreferenceid' />" +
            "<attribute name='ecer_firstname' />" +
            "<attribute name='ecer_lastname' />" +
            "<attribute name='ecer_emailaddress' />" +
            "<attribute name='ecer_phonenumber' />" +
            "<attribute name='ecer_knownapplicanttimechoice' />" +
            "<attribute name='ecer_relationshiptoapplicant' />" +
            "<attribute name='ecer_applicationid' />" +
            "<order attribute='ecer_lastname' descending='false' />" +
            "<filter type='and'>" +
            "<condition attribute='ecer_applicationid' operator='eq' value='" + applicationId + "' />" +
            "</filter>" +
            "</entity >" +
            "</fetch >";

        var characterReferenceSubgridControl = formContext.getControl("subgrid_characterreference");
        if (characterReferenceSubgridControl !== null) {

            characterReferenceSubgridControl.setFilterXml(fetchXML);
            characterReferenceSubgridControl.refresh();
        }
        else {
            // Run 2 seconds later if subgrid is not loaded.
            setTimeout(ECER.Jscripts.ApplicationAssessments.characterReferenceGridPreFilter(executionContext), 2000);
        }

    },

    showHideLabourMobilityTab: function (executionContext) {

        var formContext = executionContext.getFormContext();

        var applicationAttribute = formContext.getAttribute("ecer_applicationid")
        if (applicationAttribute == null || applicationAttribute.getValue() == null) {
            crm_Utility.showHide(executionContext, false, "tab_labourmobility")
            return
        }

        var applicationId = applicationAttribute.getValue()[0].id.replace("{", "").replace("}", "")

        Xrm.WebApi.retrieveRecord("ecer_application", applicationId, "?$select=ecer_type").then(
            function success(record) {
                var showLMTab = (record.ecer_type !== null && record.ecer_type === 621870003)
                crm_Utility.showHide(executionContext, showLMTab, "tab_labourmobility")
            },
        function (error) {
            // Couldn’t retrieve the Application – hide the tab
            console.error("showHideLabourMobilityTab: " + error.message);
            crm_Utility.showHide(executionContext, false, "tab_labourmobility");
        }
        )
    }
}


