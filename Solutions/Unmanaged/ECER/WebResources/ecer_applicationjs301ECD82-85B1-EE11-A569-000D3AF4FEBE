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
        ECER.Jscripts.Application.showHideParentalGuidianceFieldsOnApplicantAge(executionContext);
        //ECER.Jscripts.Application.closeFormIfDraft(executionContext);
    },

    // No longer need.  Will allow user to overwrite
    disableSystemPopulateFields: function (executionContext) {
        crm_Utility.enableDisable(executionContext, true, "ecer_characterreferencereceiveddate");
        crm_Utility.enableDisable(executionContext, true, "ecer_workexperiencereceiveddate");
        crm_Utility.enableDisable(executionContext, true, "ecer_transcriptreceiveddate");
        crm_Utility.enableDisable(executionContext, true, "ecer_parentalreferencereceiveddate");
        crm_Utility.enableDisable(executionContext, true, "ecer_readyforassessmentdate");
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
        var statuscode = 621870002; // Review for Completeness
        if (readyForAssessmentAttribute != null && readyForAssessmentAttribute.getValue() != null) {
            if (readyForAssessmentAttribute.getValue()) {
                statuscode = 621870003; // Ready for Assessment
            }
        }

        var statuscodeAttribute = formContext.getAttribute("statuscode");
        statuscodeAttribute.setValue(statuscode);
    },

    hasProgramClerkSecurityRole: function () {
        // Directive to prevent use of undeclared variables
        "use strict";
        return crm_Utility.checkCurrentUserRole("ECER - Certification Baseline Role");
    },

    preventAutoSave: function (executionContext) {
        var eventArgs = executionContext.getEventArgs();
        if (eventArgs.getSaveMode() == 70 || eventArgs.getSaveMode() == 2) {
            eventArgs.preventDefault();
        }
    },

    showHideParentalGuidianceFieldsOnApplicantAge: function (executionContext) {
        var show = false;
        var formContext = executionContext.getFormContext();
        var applicantAgeAttribute = formContext.getAttribute("ecer_applicantage");
        var parentalReferenceReceivedAttributeName = "ecer_parentalreferencereceived";
        var parentalReferenceReceivedDateAttributeName = "ecer_parentalreferencereceiveddate";
        if (applicantAgeAttribute != null && applicantAgeAttribute.getValue() != null && applicantAgeAttribute.getValue() < 19) {
            show = true;
        }
        crm_Utility.showHide(executionContext, show, parentalReferenceReceivedAttributeName);
        crm_Utility.showHide(executionContext, show, parentalReferenceReceivedDateAttributeName);
    },

    evaluateAgeOnSubmissionDate: function (executionContext) {
        try {
            var formContext = executionContext.getFormContext();
            var isOver19 = false;
            
            var dateSubmittedAttribute = formContext.getAttribute("ecer_datesubmitted");
            if (dateSubmittedAttribute == null || dateSubmittedAttribute.getValue() == null) {
                return; // No Date Submitted to compare
            }

            var birthDateAttribute = formContext.getAttribute("ecer_dateofbirth");
            var applicantAgeOnSubmission
            var birthDate = new Date();
            if (birthDateAttribute != null && birthDateAttribute.getValue() != null) {
                birthDate = birthDateAttribute.getValue();
                var diff = (today.getTime() - birthDate.getTime()) / 1000;
                diff /= (60 * 60 * 24);
                var differenceInYears = Math.abs(Math.round(diff / 365.25));
                if (differenceInYears >= 19) {
                    isOver19 = true;
                }
            }
            var isUnder19Attribute = formContext.getAttribute("ecer_isunder19");
            if (isUnder19Attribute != null) {
                var isUnder19Value = isUnder19Attribute.getValue();
                // Set value if the value is different
                if (isUnder19Value != 621870000 && !isOver19) {
                    isUnder19Attribute.setValue(621870000);
                    formContext.data.save();
                }
                else if (isUnder19Value != 621870001 && isOver19) {
                    isUnder19Attribute.setValue(621870001);
                    formContext.data.save();
                }
            }
        }
        catch (err) {
            ECER.Jscripts.Contact.showMessage(err);
        }
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

    onProfileCreationButton: function () {
        // Directive to prevent use of undeclared variables
        "use strict";
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
        "use strict";
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
 