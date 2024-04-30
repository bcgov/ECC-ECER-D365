if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}


ECER.Jscripts.Investigation =
{
    onLoad: function (executionContext) {
        ECER.Jscripts.Investigation.lockComplaintInfo(executionContext);
        ECER.Jscripts.Investigation.showHideParallelProcess(executionContext);
    },

    getApplicantInfo: function (executionContext) {
        var formContext = executionContext.getFormContext();

        var applicant = formContext.getAttribute("ecer_applicant");
        // From Contact
        var clientId = formContext.getAttribute("ecer_clientid");
        var dateOfBirth = formContext.getAttribute("ecer_dateofbirth");
        var isUnderNineteen = formContext.getAttribute("ecer_registrantisminor");
        var phoneNumber = formContext.getAttribute("ecer_telephonenumbercontact");
        var mailAddress = formContext.getAttribute("ecer_mailingaddresscontact");
        var email = formContext.getAttribute("ecer_emailaddresscontact");

        // From Certificate
        var currentCertificate = formContext.getAttribute("ecer_currentcertificate");
        var certificateNumber = formContext.getAttribute("ecer_certificatenumber");
        var certificateStatus = formContext.getAttribute("ecer_certificatestatus");
        var expiryDate = formContext.getAttribute("ecer_expirydate");
        var certificationType = formContext.getAttribute("ecer_certificationtype");

        // From Application
        var openApplication = formContext.getAttribute("ecer_openapplication");
        var parallelProcess = formContext.getAttribute("ecer_parallelprocess");
        // Default to No
        parallelProcess.setValue(621870001);

        // From Transcript
        var educationalInstitution = formContext.getAttribute("ecer_educationalinstitution");

        var attributeList = [clientId, certificationType, certificateStatus, expiryDate, educationalInstitution,
            dateOfBirth, isUnderNineteen, phoneNumber, mailAddress, email, currentCertificate, openApplication, certificateNumber];

        // Clear on all fields on change
        var i = 0, len = attributeList.length;
        while (i < len) {
            attributeList[i].setValue(null);
            i++;
        }

        // Returen if Applicant is empty
        if (applicant == null || applicant.getValue() == null) {
            return;
        }

        // Get Contact
        var contactId = applicant.getValue()[0].id.replace("{", "").replace("}", "");

        Xrm.WebApi.retrieveRecord("contact", contactId, "?$select=birthdate,ecer_clientid,emailaddress1,ecer_isunder19,address1_composite,telephone1").then(
            function success(result) {
                console.log(result);
                // Result
                clientId.setValue(result["ecer_clientid"].toString());
                phoneNumber.setValue(result["telephone1"]);
                mailAddress.setValue(result["address1_composite"]);
                email.setValue(result["emailaddress1"]);

                var birthdayVal = new Date(result["birthdate@OData.Community.Display.V1.FormattedValue"]);
                dateOfBirth.setValue(birthdayVal);
                dateOfBirth.setSubmitMode("always");

                var isUnderNineteenVal;
                if (result["ecer_isunder19@OData.Community.Display.V1.FormattedValue"] == "Yes") { isUnderNineteenVal = 621870000; } else { isUnderNineteenVal = 621870001; }
                isUnderNineteen.setValue(isUnderNineteenVal);
            },
            function (error) {
                console.log(error.message);
            }
        );

        // Get Certificate
        var certificateIdPromise = Xrm.WebApi.retrieveMultipleRecords("ecer_certificate", "?$select=ecer_certificateid,ecer_certificatelevel,ecer_certificatenumber,ecer_expirydate,ecer_name,statuscode&$filter=_ecer_registrantid_value eq " + contactId + "&$orderby=ecer_expirydate desc").then(
            function success(results) {
                console.log(results);
                if (results.entities.length > 0) {
                    var result = results.entities[0];
                    // Set Values
                    certificateNumber.setValue(result["ecer_certificatenumber"]);
                    certificateStatus.setValue(result["statuscode@OData.Community.Display.V1.FormattedValue"]);

                    var expiryDateVal = new Date(result["ecer_expirydate@OData.Community.Display.V1.FormattedValue"])
                    expiryDate.setValue(expiryDateVal);
                    expiryDate.setSubmitMode("always");

                    certificationType.setValue(result["ecer_certificatelevel"]);
                    ECER.Jscripts.Investigation.setValueToLookup(currentCertificate, result["ecer_certificateid"], result["ecer_name"], "ecer_certificate");
                    return result.certificateId;
                } else {
                    console.log("No Certificate is found for Registrant:" + contactId);
                    return null;
                }
            },
            function (error) {
                console.log(error.message);
                return null;
            }
        );


        Promise.all([certificateIdPromise]).then(function (values) {
            var certificateId = values[0];
            // Get Transcript
            Xrm.WebApi.retrieveMultipleRecords("ecer_transcript", "?$select=ecer_educationinstitutionfullname&$filter=ecer_Applicationid/_ecer_certificateid_value eq " + certificateId).then(
                function success(results) {
                    console.log(results);
                    if (results.entities.length > 0) {
                        var result = results.entities[0];

                        educationalInstitution.setValue(result["ecer_educationinstitutionfullname"]);
                    }
                },
                function (error) {
                    console.log(error.message);
                }
            );
        });

        // Get Open Applicaiton
        Xrm.WebApi.retrieveMultipleRecords("ecer_application", "?$select=ecer_applicationid,ecer_name,statecode&$filter=(_ecer_applicantid_value eq " + contactId + " and statecode eq 0)&$orderby=createdon desc").then(
            function success(results) {
                console.log(results);
                if (results.entities.length > 0) {
                    var result = results.entities[0];
                    parallelProcess.setValue(621870000);
                    ECER.Jscripts.Investigation.setValueToLookup(openApplication, result["ecer_applicationid"], result["ecer_name"], "ecer_application");
                    return result.ecer_applicationid;
                } else {
                    console.log("No current open Application for Registrant:" + contactId);
                    return null;
                }
            },
            function (error) {
                console.log(error.message);
                return null;
            }
        );
    },

    // Registry cannot edit initial complaint information created from Portal
    lockComplaintInfo: function (executionContext) {
        var formContext = executionContext.getFormContext();

        var portalSubmission = formContext.getAttribute("ecer_portalsubmission");

        if (portalSubmission != null && portalSubmission.getValue() == true) {
            return;
        }

        // Unlock Complainant Contact Info section
        formContext.ui.tabs.get("{1328d0d8-b96a-4553-a84d-fb0fb98086db}")
            .sections.get("{1328d0d8-b96a-4553-a84d-fb0fb98086db}_section_3")
            .controls.forEach((e) => e.setDisabled(false));

        // Unlock Registrant Contact Info Provided by Complainant section
        formContext.ui.tabs.get("{1328d0d8-b96a-4553-a84d-fb0fb98086db}")
            .sections.get("{1328d0d8-b96a-4553-a84d-fb0fb98086db}_section_2")
            .controls.forEach((e) => e.setDisabled(false));

        // Unlock Complaint Info section
        formContext.ui.tabs.get("{1328d0d8-b96a-4553-a84d-fb0fb98086db}")
            .sections.get("{1328d0d8-b96a-4553-a84d-fb0fb98086db}_section_10")
            .controls.forEach((e) => e.setDisabled(false));

        // Unlock Location of Incident section
        formContext.ui.tabs.get("{1328d0d8-b96a-4553-a84d-fb0fb98086db}")
            .sections.get("{1328d0d8-b96a-4553-a84d-fb0fb98086db}_section_5")
            .controls.forEach((e) => e.setDisabled(false));
    },

    setValueToLookup: function (lookupField, id, name, entityType) {
        var lookupValue = new Array();
        lookupValue[0] = new Object();
        lookupValue[0].id = id;
        lookupValue[0].name = name;
        lookupValue[0].entityType = entityType;
        lookupField.setValue(lookupValue);
    },

    referToInvestigationButtonClick: function (PrimaryControl) {
        var pageInput = {
            pageType: "webresource",
            webresourceName: "ecer_refertoinvestigation.html"
        };

        var navigationOptions = {
            target: 2,
            width: 400, // value specified in pixel
            height: 250, // value specified in pixel
            position: 1,
            title: "Refer to Investigation"
        };

        var applicationId = PrimaryControl.data.entity.getId().replace("{", "").replace("}", "");

        // Load Html input page
        Xrm.Navigation.navigateTo(pageInput, navigationOptions).then(
            function success(returnValue) {
                // Run code on success

                // Return if cancel button is selected
                if (returnValue.returnValue == "Cancelled" || returnValue.returnValue == null) { return; }

                // Description is required
                if (returnValue.returnValue == "EmptyDescription") {
                    // Reopen input dialog
                    ECER.Jscripts.Investigation.referToInvestigationButtonClick(PrimaryControl);

                    // Alert dialog
                    alert("Please enter a description");
                    return;
                }

                // Call the action ECER - Refer to investigation action
                var parameters = {};
                parameters.Description = returnValue.returnValue; // Edm.String

                fetch(Xrm.Utility.getGlobalContext().getClientUrl() + "/api/data/v9.2/ecer_applications(" + applicationId + ")/Microsoft.Dynamics.CRM.ecer_ECERRefertoinvestigationaction", {
                    method: "POST",
                    headers: {
                        "OData-MaxVersion": "4.0",
                        "OData-Version": "4.0",
                        "Content-Type": "application/json; charset=utf-8",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify(parameters)
                }).then(
                    function success(response) {
                        if (response.ok) {
                            // Confirmation dialog
                            var confirmStrings = { text: "Investigation Record is successfully created", title: "Confirmation" };
                            var confirmOptions = { height: 200, width: 450 };
                            Xrm.Navigation.openConfirmDialog(confirmStrings, confirmOptions).then(
                                function (success) {
                                    if (success.confirmed)
                                        console.log("Dialog closed using OK button.");
                                    else
                                        console.log("Dialog closed using Cancel button or X.");
                                });
                            console.log("Success");
                        } else {
                            return response.json().then((json) => { throw json.error; });
                        }
                    }
                ).catch(function (error) {
                    console.log(error.message);
                });

            },
            function error(e) {
                console.log(e.message);
            }
        );
    },

    showHideParallelProcess: function (executionContext) {
        var formContext = executionContext.getFormContext();

        // Parallel Process is Yes
        if (formContext.getAttribute("ecer_parallelprocess").getValue() == 621870000) {
            var tab = formContext.ui.tabs.get("tab_8");
            if (tab) {
                tab.setVisible(true);
            }
        }
    },
}