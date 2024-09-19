﻿// Javascript source code

if (typeof ECER === "undefined") {
    var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {}
}

ECER.Jscripts.WorkExperienceReference = {
    crm_ExecutionContext: null,
    onLoad: function (executionContext) {
        this.crm_ExecutionContext = executionContext;
        ECER.Jscripts.WorkExperienceReference.showHideOnProvinceSelected(executionContext);
        ECER.Jscripts.WorkExperienceReference.defaultTypeOnCreation(executionContext);
        ECER.Jscripts.WorkExperienceReference.showHide400500OnType(executionContext);
        ECER.Jscripts.WorkExperienceReference.filterOutRelationshipOfApplicant(executionContext);
    },

    defaultTypeOnCreation: function (executionContext) {
        var typeAttributeName = "ecer_type";
        var fourHundredHrs = 621870000;
        var fiveHundredHrs = 621870001;
        var applicationAttributeName = "ecer_applicationid";
        var applicantAttributeName = "ecer_applicantid";

        var formContext = executionContext.getFormContext();
        var formType = formContext.ui.getFormType();
        if (formType !== 1) {
            // only interest if during create mode
            return;
        }
        var applicationAttribute = formContext.getAttribute(applicationAttributeName);
        var applicationId = applicationAttribute.getValue()[0].id.replace("{", "").replace("}", "");
        if (applicationAttribute === null || applicationAttribute.getValue() === null) {
            return;
        }
        Xrm.WebApi.retrieveRecord("ecer_application", applicationId, "?$select=ecer_type")
            .then(function (result) {
                if (result) {
                    var type = result.ecer_type;
                    if (type !== 621870001) {
                        return;
                    }
                    else {
                        var option = "?$filter=_" + applicationAttributeName + "_value eq '" + applicationId + "' and ecer_type ne null";
                        Xrm.WebApi.retrieveMultipleRecords("ecer_workexperienceref", option).then(
                            function success(results) {
                                if (results.entities.length > 0) {
                                    var typeUsedPreviously = results.entities[0].ecer_type;
                                    formContext.getAttribute(typeAttributeName).setValue(typeUsedPreviously);
                                }
                                else {
                                    var applicantAttribute = formContext.getAttribute(applicantAttributeName);
                                    if (applicantAttribute === null || applicantAttribute.getValue() === null) {
                                        return;
                                    }
                                    var applicantId = applicantAttribute.getValue()[0].id.replace("{", "").replace("}", "");
                                    var dateToCompare = new Date();
                                    var latestCertificate = ECER.Jscripts.Application.getApplicantLatestCertificate(executionContext, applicantId, dateToCompare);
                                    if (latestCertificate !== null) {
                                        formContext.getAttribute(typeAttributeName).setValue(fourHundredHrs);
                                    }
                                    else {
                                        formContext.getAttribute(typeAttributeName).setValue(fiveHundredHrs);
                                    }
                                }
                            }
                        );

                    }
                }

            }
            );

    },

    filterOutRelationshipOfApplicant: function (executionContext) {
        var teacher = "621870003"; // Legacy
        var parent = "621870004"; // Only for 400
        var supervisor = "621870000"; // Supervisor
        var coworker = "621870001"; // Coworker
        var others = "621870002"; // Others
        var relationshipToApplicantAttributeName = "ecer_relationshiptoapplicant";
        crm_Utility.filterOutOptionSet(executionContext, relationshipToApplicantAttributeName, teacher);
        var formContext = executionContext.getFormContext();
        var theControl = formContext.getControl(relationshipToApplicantAttributeName);
        var currentOptions = theControl.getOptions();
        var typeValue = formContext.getAttribute("ecer_type").getValue();
        if (typeValue === 621870001) // 500 
        {
            crm_Utility.filterOutOptionSet(executionContext, relationshipToApplicantAttributeName, parent);
            var optionToCompare = parseInt(others);
            var hasMatch = false;
            for (var i = 0; i < currentOptions.length; i++) {

                var currentOption = currentOptions[i].value;
                if (currentOption !== currentOption) {
                    // current Option is NaN
                    continue;
                }
                if (currentOption == optionToCompare) {
                    hasMatch = true;
                    break;
                }
            }

            if (!hasMatch) {
                theControl.addOption({
                    value: 621870002,
                    text: "Others"
                });
            }
        }
        else {
            // Filter Out Other
            crm_Utility.filterOutOptionSet(executionContext, relationshipToApplicantAttributeName, others);
            // Add Parent back in if does not already have it.
            
            var optionToCompare = parseInt(parent);
            var hasMatch = false;
            for (var i = 0; i < currentOptions.length; i++) {
                
                var currentOption = currentOptions[i].value;
                if (currentOption !== currentOption) {
                    // current Option is NaN
                    continue;
                }
                if (currentOption == optionToCompare) {
                    hasMatch = true;
                    break;
                }
            }

            if (!hasMatch) {
                theControl.addOption({
                    value: 621870004,
                    text: "Parent/Guardian of Child in Care"
                });
            }
        }
    },

    showHide400500OnType: function (executionContext) {
        // ECER-2666, ECER-2667, ECER-2668
        // 400 Hours Work Experience contains a lot less response
        var details500SectionName = "tab_workinformation:section_details_500";
        var details400SectionName = "tab_workinformation:section_details_400";
        var response500SectionName = "tab_competenciesassessment:section_response_500HR";
        var response400SectionName = "tab_competenciesassessment:section_response_400HR";
        var formContext = executionContext.getFormContext();
        var typeAttributeName = "ecer_type";
        var typeAttribute = formContext.getAttribute(typeAttributeName);
        if (typeAttribute == null || typeAttribute.getValue() === null) {
            return; // No attribute to be evaluate
        }
        var typeAttributeValue = typeAttribute.getValue();
        // If 400 Hours
        var is400 = (typeAttributeValue === 621870000);
        var is500 = (typeAttributeValue === 621870001);

        crm_Utility.showHide(executionContext, is400, details400SectionName);
        crm_Utility.showHide(executionContext, is400, response400SectionName);
        crm_Utility.showHide(executionContext, is500, details500SectionName);
        crm_Utility.showHide(executionContext, is500, response500SectionName);
    },

    showHideOnProvinceSelected: function (executionContext) {
        // ECER-1161
        // Lookup for Province.  If selected Other, then show the text field and make that required.
        // Other Province GUID
        var otherProvinceGUID = "5e291527-7ada-ee11-904c-002248d56374";
        var formContext = executionContext.getFormContext();
        var lookupAttributeName = "ecer_referenceececertifiedprovinceid";
        var textAttributeName = "ecer_referenceececertifiedprovince";
        var lookupAttribute = formContext.getAttribute(lookupAttributeName);
        var show = false;
        var required = "none";
        if (lookupAttribute != null && lookupAttribute.getValue() != null) {
            var lookupValue = lookupAttribute.getValue()[0].id.toLowerCase().replace("{", "").replace("}", "");
            if (lookupValue == otherProvinceGUID) {
                required = "required";
                show = true;
            }
        }

        crm_Utility.showHide(executionContext, show, textAttributeName);
        crm_Utility.setRequiredLevel(executionContext, required, textAttributeName);
    },

    onSearchReferenceButton: function () {
        // Directive to prevent use of undeclared variables
        var executionContext = this.crm_ExecutionContext;
        var formContext = executionContext.getFormContext();
        try {

            var refContactAttribute = formContext.getAttribute("ecer_referencecontactid");

            var currentCertificateNumberAttribute = formContext.getAttribute("ecer_referenceececertificationnumber");
            if (currentCertificateNumberAttribute == null || currentCertificateNumberAttribute.getValue() == null || currentCertificateNumberAttribute.getValue().trim() == '') {
                // Prompt message
                var msgTitle = "Reference ECE Certificate Number does not contains data";
                var errMsg = "Reference ECE Certificate Number does not contains data.  Please verify and try again";
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
                        formContext.getControl("ecer_referencecontactid").setDisabled(false);
                    }
                    else {
                        var lastNameFromRecord = results.entities[0].lastname;
                        var firstNameFromRecord = results.entities[0].firstname;
                        var emailFromRecord = results.entities[0].emailaddress1;
                        var primaryPhoneFromRecord = results.entities[0].telephone1;

                        var entityRecordId = results.entities[0].contactid;
                        var entityRecordName = results.entities[0].fullname;

                        var lastName = formContext.getAttribute("ecer_lastname").getValue();
                        var firstName = formContext.getAttribute("ecer_firstname").getValue();
                        var email = formContext.getAttribute("ecer_emailaddress").getValue();
                        var primaryPhone = formContext.getAttribute("ecer_phonenumber").getValue();

                        var totalMatch = lastNameFromRecord == lastName &&
                            firstNameFromRecord == firstName &&
                            email == emailFromRecord &&
                            primaryPhone == primaryPhoneFromRecord;

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
                            refContactAttribute.setValue(lookupArray);
                            formContext.data.save();
                            return; // Exit upon setting lookup with the contact record.
                        }

                        // Not Exact Match in details.  Do we still want to use this lookup?
                        var msg = "Certificate #: " + currentCertificateNumber + " profile found is not matching 100%" +
                            "\nRecord found from system\n\n" +
                            "\nFirst Name: " + firstNameFromRecord +
                            "\nLast Name: " + lastNameFromRecord +
                            "\nEmail: " + emailFromRecord +
                            "\nPrimary Phone: " + primaryPhoneFromRecord;
                        var msgTitle = "Confirm using this Profile Information";

                        var confirmStrings = { confirmButtonLabel: "Confirm", cancelButtonLabel: "Cancel", text: msg, title: msgTitle };
                        var confirmOptions = { height: 360, width: 480 };
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
                                    refContactAttribute.setValue(lookupArray);
                                    formContext.data.save();
                                }
                                else {
                                    // ref contact control set disable
                                    formContext.getControl("ecer_referencecontactid").setDisabled(false);
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


