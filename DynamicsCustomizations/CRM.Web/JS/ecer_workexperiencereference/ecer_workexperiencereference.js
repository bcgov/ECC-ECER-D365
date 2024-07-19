// Javascript source code

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
                            ECER.Jscripts.Application.showHideApplicantQuickView(executionContext);
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
                                    ECER.Jscripts.Application.showHideApplicantQuickView(executionContext);
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


