// JavaScript source code
if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.Investigation =
{
    onLoad: function (executionContext) {
        var formContext = executionContext.getFormContext();

        ECER.Jscripts.Investigation.lockComplaintInfo(executionContext);
        ECER.Jscripts.Investigation.showHideParallelProcess(executionContext);
        ECER.Jscripts.Investigation.showHideReasonForPriorityAssignment(executionContext);
        ECER.Jscripts.Investigation.registrantHasActiveCondition(executionContext);
        ECER.Jscripts.Investigation.registrantHasSuspendedCertificate(executionContext);
        ECER.Jscripts.Investigation.displayFindingsOrAllegations(executionContext);
        ECER.Jscripts.Investigation.showHideImmediateActions(executionContext);
        ECER.Jscripts.Investigation.onChangeInvestigationOutcomeInfo(executionContext);
        ECER.Jscripts.Investigation.onChangeTDADFacility(executionContext);
        ECER.Jscripts.Investigation.hideBPFResponseDate(executionContext);

    },
    //ECER-5195
    hideBPFResponseDate: function (executionContext) {
        var formContext = executionContext.getFormContext();

        // Get the Report In Progress BPF control and value
        var reportInProgressControl = formContext.getAttribute("ecer_reportinprogress");

        if (!reportInProgressControl) return;

        var reportInProgressValue = reportInProgressControl.getValue();
        var show = reportInProgressValue === 621870001;
        crm_Utility.showHide(executionContext, !show, "header_process_ecer_requestedresponsebydate");



    },
    registrantHasSuspendedCertificate: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var applicant = formContext.getAttribute("ecer_applicant").getValue();
        if (applicant == null) {
            return;
        }
        var formType = formContext.ui.getFormType();
        if (formType !== 2 &&
            formType !== 3 &&
            formType !== 4) {
            // Only care of Update, Read Only, Disabled if on Contact entity
            return;
        }


        var registrantId = applicant[0].id;
        registrantId = registrantId.replace("{", "").replace("}", "");
        var uniqueId = registrantId.replace("-", "") + "HasCertificateSuspended";
        formContext.ui.clearFormNotification(uniqueId);
        var query = "?$filter=_ecer_registrantid_value eq " + registrantId + " and statuscode eq 621870004 and statecode eq 0 ";
        Xrm.WebApi.retrieveMultipleRecords("ecer_certificate", query).then(
            function success(results) {
                if (results.entities.length > 0) {
                    // Has Active Certificate Solution
                    var message = "Registrant has suspended certificate";
                    var level = "WARNING";
                    formContext.ui.setFormNotification(message, level, uniqueId);
                }
            }
        );

    },
    //ECER-5214
    registrantHasActiveCondition: function (executionContext, registrantId) {
        var formContext = executionContext.getFormContext();
        var applicant = formContext.getAttribute("ecer_applicant").getValue();
        if (applicant == null) {
            return;
        }
        var formType = formContext.ui.getFormType();
        if (formType !== 2 &&
            formType !== 3 &&
            formType !== 4) {
            // Only care of Update, Read Only, Disabled if on Contact entity
            return;
        }


        var registrantId = applicant[0].id;
        registrantId = registrantId.replace("{", "").replace("}", "");
        var uniqueId = registrantId.replace("-", "") + "HasActiveConditions";
        formContext.ui.clearFormNotification(uniqueId);
        var option = "?$filter=_ecer_registrantid_value eq " + registrantId + " and statecode eq 0";
        Xrm.WebApi.retrieveMultipleRecords("ecer_certificateconditions", option).then(
            function success(results) {
                if (results.entities.length > 0) {
                    // Has Active Certificate Solution
                    var message = "Registrant has active terms and conditions currently";
                    var level = "WARNING";
                    formContext.ui.setFormNotification(message, level, uniqueId);
                }
            }
        );
    },


    //10 / day
    onChangeTDADFacility: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var tdadFacility = formContext.getAttribute("ecer_tdadfacility");

        // Show section on Active tab when yes
        formContext.ui.tabs.get("tab_2")?.sections?.get("tab_Active_section_9")?.setVisible(tdadFacility != null && tdadFacility.getValue() === 621870000);
    },
    onChangeInvestigationOutcomeInfo: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var required = "none";
        var hide = false;	        //ECER-5391
        var show =
            formContext.getAttribute("ecer_investigationoutcome") &&
            formContext.getAttribute("ecer_investigationoutcome").getValue() != null;
        if (show) {
            required = "required";
        }

        crm_Utility.showHide(executionContext, show, "ecer_finalreportsent");

        //ECER-5391 (Hide the 'Report printed and filed' field on form as it is no longer needed on form and BPF)
        crm_Utility.showHide(executionContext, hide, "ecer_reportprintedandfiled");
        //ECER-5391

        crm_Utility.showHide(
            executionContext,
            show,
            "header_process_ecer_finalreportsent_1"
        );

        //ECER-5391 (Hide 'Report printed and filed' step (field) on BPF as it is no longer needed on form and BPF)	
        crm_Utility.showHide(
            executionContext,
            hide,
            "header_process_ecer_reportprintedandfiled_1"
        );
        //ECER-5391	

        crm_Utility.showHide(
            executionContext,
            show,
            "header_process_ecer_finalreportsent"
        );

        //ECER-5391 (Hide 'Report printed and filed' step (field) on BPF as it is no longer needed on form and BPF)	
        crm_Utility.showHide(
            executionContext,
            hide,
            "header_process_ecer_reportprintedandfiled"
        );
        //ECER-5391	

        crm_Utility.setRequiredLevel(
            executionContext,
            required,
            "ecer_finalreportsent"
        );

        //ECER-5391 (comment this line of code as the 'Report printed and filed' field is no longer needed on form and BPF)	
        //crm_Utility.setRequiredLevel(
        //  executionContext,
        //  required,
        //  "ecer_reportprintedandfiled"
        //);
        //ECER-5391	

    },

    // Set Certification Type / Certificate Expiry Date / Certificate Status
    getCurrentCertificateInfo: function (executionContext) {
        console.log("Executing getCurrentCertificateInfo");

        let formContext = executionContext.getFormContext();

        let currentCertificate = formContext.getAttribute("ecer_currentcertificate");

        if (currentCertificate === null || currentCertificate.getValue() === null)
            return;

        let currentCertificateId = currentCertificate.getValue()[0].id.replace("{", "").replace("}", "");

        // Make async call, get values and save
        console.log("Retreiving ecer_certificate for " + currentCertificateId);

        Xrm.WebApi.retrieveRecord("ecer_certificate", currentCertificateId, "?$select=ecer_expirydate,ecer_certificatelevel,ecer_certificatenumber,statuscode").then(
            function (result) {
                console.log("Data retrieved for " + currentCertificateId);

                // From Certificate
                if (result.hasOwnProperty("ecer_certificatelevel"))
                    formContext.getAttribute("ecer_certificationtype")?.setValue(result["ecer_certificatelevel"]);

                if (result.hasOwnProperty("statuscode"))
                    formContext.getAttribute("ecer_certificatestatus")?.setValue(result["statuscode@OData.Community.Display.V1.FormattedValue"]);

                if (result.hasOwnProperty("ecer_expirydate")) {
                    let expiryDate = formContext.getAttribute("ecer_expirydate");
                    let expiryDateVal = new Date(result["ecer_expirydate@OData.Community.Display.V1.FormattedValue"])
                    expiryDate.setValue(expiryDateVal);
                    expiryDate.setSubmitMode("always");
                }

                if (result.hasOwnProperty("ecer_certificatenumber")) {
                    formContext.getAttribute("ecer_certificatenumber")?.setValue(result["ecer_certificatenumber"]);
                }
            },
            function (error) {
                console.log(error.message);
            }
        );
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
                    let certificationHierarchyData = ECER.Jscripts.Investigation.Data.CertificationHierarchy();

                    let allActive = results.entities.filter(function (f) {
                        return f.statuscode == 1;
                    });

                    let result = null;

                    // More than 1 active
                    if (allActive.length > 0) {
                        // Pick highest active last to expire
                        let highestActiveLevel3s = allActive.filter(function (f) {
                            return f.ecer_certificatelevel.includes(certificationHierarchyData.Level3);
                        });

                        let highestActiveLevel2s = allActive.filter(function (f) {
                            return f.ecer_certificatelevel === certificationHierarchyData.Level2;
                        });

                        let highestActiveLevel1s = allActive.filter(function (f) {
                            return certificationHierarchyData.Level1.includes(f.ecer_certificatelevel);
                        });

                        if (highestActiveLevel3s.length > 0)
                            result = highestActiveLevel3s[0];
                        else if (highestActiveLevel2s.length > 0) {
                            result = highestActiveLevel2s[0];
                        }
                        else if (highestActiveLevel1s.length > 0) {
                            result = highestActiveLevel1s[0];
                        }
                    }
                    // None active
                    else {
                        // Pick highest inactive last to expire
                        let highestInactiveLevel3s = results.entities.filter(function (f) {
                            return f.ecer_certificatelevel.includes(certificationHierarchyData.Level3);
                        });

                        let highestInactiveLevel2s = results.entities.filter(function (f) {
                            return f.ecer_certificatelevel === certificationHierarchyData.Level2;
                        });

                        let highestInactiveLevel1s = results.entities.filter(function (f) {
                            return certificationHierarchyData.Level1.includes(f.ecer_certificatelevel);
                        });

                        if (highestInactiveLevel3s.length > 0)
                            result = highestInactiveLevel3s[0];
                        else if (highestInactiveLevel2s.length > 0) {
                            result = highestInactiveLevel2s[0];
                        }
                        else if (highestInactiveLevel1s.length > 0) {
                            result = highestInactiveLevel1s[0];
                        }
                    }

                    // Set Values
                    certificateNumber.setValue(result["ecer_certificatenumber"]);
                    certificateStatus.setValue(result["statuscode@OData.Community.Display.V1.FormattedValue"]);

                    var expiryDateVal = new Date(result["ecer_expirydate@OData.Community.Display.V1.FormattedValue"])
                    expiryDate.setValue(expiryDateVal);
                    expiryDate.setSubmitMode("always");

                    certificationType.setValue(result["ecer_certificatelevel"]);
                    ECER.Jscripts.Investigation.setValueToLookup(currentCertificate, result["ecer_certificateid"], result["ecer_name"], "ecer_certificate");
                    return result.ecer_certificateid;
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

            if (certificateId !== null) {
                Xrm.WebApi.retrieveMultipleRecords("ecer_transcript", "?$select=ecer_educationinstitutionfullname&$filter=ecer_Applicationid/_ecer_certificateid_value eq " + certificateId).then(
                    function success(results) {
                        console.log(results);
                        if (results.entities.length > 0) {
                            console.log("Eductional institutes for that cert id: ", results.entities)
                            var result = results.entities[0];
                            educationalInstitution.setValue(result["ecer_educationinstitutionfullname"]);
                        }
                    },
                    function (error) {
                        console.log(error.message);
                    }
                );
            }
        });

        // Get Open Applicaiton
        Xrm.WebApi.retrieveMultipleRecords("ecer_application", "?$select=ecer_applicationid,ecer_name,statecode&$filter=(_ecer_applicantid_value eq " + contactId + " and statecode eq 0)&$orderby=createdon desc").then(
            function success(results) {
                console.log(results);
                if (results.entities.length > 0) {
                    var result = results.entities[0];
                    // parallelProcess.setValue(621870000);
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

    //Called on load If Source equals the following options, display the Findings subgrid, otherwise display the Allegations subgrid:
    //NOTE that the visibility property is actually on the sections containing the subgrids.
    // Logic updated as per ECER-5242
    displayFindingsOrAllegations: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var sourceAttribute = formContext.getAttribute("ecer_source");

        // Check if the source attribute is null
        if (!sourceAttribute) {
            console.error("Source attribute 'ecer_source' is null or undefined.");
            return;
        }

        var source = sourceAttribute.getValue();

        // Retrieve the findings
        var findingsSection = formContext.ui.tabs.get("{1328d0d8-b96a-4553-a84d-fb0fb98086db}")
            .sections.get("{1328d0d8-b96a-4553-a84d-fb0fb98086db}_section_12");

        // Check if the sections are null
        if (!findingsSection) {
            console.error("Findings section is null or undefined.");
            return;
        }

        var healthAuthorities = [
            621870018,  //"Island Health Authority",
            621870019,  //"Interior Health Authority",
            621870020,  //"Vancouver Coastal Health Authority",
            621870021,  //"Fraser Health Authority",
            621870022,  //"Northern Health Authority"
        ];

        if (healthAuthorities.includes(source)) {
            findingsSection.setVisible(false);
        } else {
            findingsSection.setVisible(true);
        }
    },

    setValueToLookup: function (lookupField, id, name, entityType) {
        var lookupValue = new Array();
        lookupValue[0] = new Object();
        lookupValue[0].id = id;
        lookupValue[0].name = name;
        lookupValue[0].entityType = entityType;
        lookupField.setValue(lookupValue);
    },

    // Application - Refer to Investigation Button 
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

        var recordId = PrimaryControl.data.entity.getId().replace("{", "").replace("}", "");
        var userSettings = Xrm.Utility.getGlobalContext().userSettings;
        var currentuserid = userSettings.userId.replace("{", "").replace("}", "");

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

                // Call the action
                var parameters = {};
                parameters.Description = returnValue.returnValue; // Edm.String
                parameters.ReferrerGUID = currentuserid;

                // Get Owner of the Action to be the calling user
                Xrm.WebApi.retrieveMultipleRecords("workflow", "?$select=_ownerid_value,primaryentity,name,uniquename&$filter=name eq 'ECER - Application Refer to investigation action'").then(
                    function success(results) {
                        console.log(results);

                        var result = results.entities[0];
                        var ownerid = result["_ownerid_value"]; // Owner

                        ECER.Jscripts.Investigation.executeReferenceVerificationAction("ecer_applications", "ecer_ECERRefertoinvestigationaction", parameters, recordId, ownerid);
                    },
                    function (error) {
                        console.log(error.message);
                    }
                );
            },
            function error(e) {
                console.log(e.message);
            }
        );
    },

    // Work Experience Reference Verification Button 
    workExperienceReferenceVerification: function (PrimaryControl) {
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

        var recordId = PrimaryControl.data.entity.getId().replace("{", "").replace("}", "");
        var userSettings = Xrm.Utility.getGlobalContext().userSettings;
        var currentUserId = userSettings.userId.replace("{", "").replace("}", "");

        // Load Html input page
        Xrm.Navigation.navigateTo(pageInput, navigationOptions).then(
            function success(returnValue) {
                // Run code on success

                // Return if cancel button is selected
                if (returnValue.returnValue == "Cancelled" || returnValue.returnValue == null) { return; }

                // Description is required
                if (returnValue.returnValue == "EmptyDescription") {
                    // Reopen input dialog
                    ECER.Jscripts.Investigation.workExperienceReferenceVerification(PrimaryControl);

                    // Alert dialog
                    alert("Please enter a description");
                    return;
                }

                // Call the action
                var parameters = {};
                parameters.Description = returnValue.returnValue; // Edm.String
                parameters.ReferrerGUID = currentUserId;

                // Get Owner of the Action to be the calling user
                Xrm.WebApi.retrieveMultipleRecords("workflow", "?$select=_ownerid_value,primaryentity,name,uniquename&$filter=name eq 'ECER - Application Refer to investigation action'").then(
                    function success(results) {
                        console.log(results);

                        var result = results.entities[0];
                        var ownerid = result["_ownerid_value"]; // Owner

                        ECER.Jscripts.Investigation.executeReferenceVerificationAction("ecer_workexperiencerefs", "ecer_ECERWorkExperienceReferenceVerification", parameters, recordId, ownerid);
                    },
                    function (error) {
                        console.log(error.message);
                    }
                );
            },
            function error(e) {
                console.log(e.message);
            }
        );
    },

    // Character Reference Verification Button
    characterReferenceVerification: function (PrimaryControl) {
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

        var recordId = PrimaryControl.data.entity.getId().replace("{", "").replace("}", "");
        var userSettings = Xrm.Utility.getGlobalContext().userSettings;
        var currentUserId = userSettings.userId.replace("{", "").replace("}", "");

        // Load Html input page
        Xrm.Navigation.navigateTo(pageInput, navigationOptions).then(
            function success(returnValue) {
                // Run code on success

                // Return if cancel button is selected
                if (returnValue.returnValue == "Cancelled" || returnValue.returnValue == null) { return; }

                // Description is required
                if (returnValue.returnValue == "EmptyDescription") {
                    // Reopen input dialog
                    ECER.Jscripts.Investigation.characterReferenceVerification(PrimaryControl);

                    // Alert dialog
                    alert("Please enter a description");
                    return;
                }

                // Call the action
                var parameters = {};
                parameters.Description = returnValue.returnValue; // Edm.String
                parameters.ReferrerGUID = currentUserId;

                // Get Owner of the Action to be the calling user
                Xrm.WebApi.retrieveMultipleRecords("workflow", "?$select=_ownerid_value,primaryentity,name,uniquename&$filter=name eq 'ECER - Application Refer to investigation action'").then(
                    function success(results) {
                        console.log(results);

                        var result = results.entities[0];
                        var ownerid = result["_ownerid_value"]; // Owner

                        ECER.Jscripts.Investigation.executeReferenceVerificationAction("ecer_characterreferences", "ecer_ECERCharacterReferenceVerification", parameters, recordId, ownerid);
                    },
                    function (error) {
                        console.log(error.message);
                    }
                );
            },

            function error(e) {
                console.log(e.message);
            }
        );
    },

    // Execute Reference Verificate Actions for Application, Character Reference AND Work Experience Reference
    executeReferenceVerificationAction: function (entityType, actionName, parameters, recordId, callingUserId) {
        fetch(Xrm.Utility.getGlobalContext().getClientUrl() + "/api/data/v9.2/" + entityType + "(" + recordId + ")/Microsoft.Dynamics.CRM." + actionName + "", {
            method: "POST",
            headers: {
                "OData-MaxVersion": "4.0",
                "OData-Version": "4.0",
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
                "MSCRMCallerID": callingUserId
            },
            body: JSON.stringify(parameters)
        }).then(
            function success(response) {
                if (response.ok) {
                    // Confirmation dialog
                    var confirmStrings = { text: "Reference has been successfully referred to Investigations for verification", title: "Confirmation" };
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

    showHideParallelProcess: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var tab = formContext.ui.tabs.get("tab_8");
        // Parallel Process is Yes
        if (formContext.getAttribute("ecer_parallelprocess").getValue() == 621870000) {
            if (tab) {
                tab.setVisible(true);
            }
        }
        else {
            tab.setVisible(false);
        }
    },
    // Show/Hide Immediate Action Tab ECER -4376

    showHideImmediateActions: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var tab = formContext.ui.tabs.get("tab_immediateactions");
        //Recommend for Immediate Action is Yes
        if (formContext.getAttribute("ecer_immediateinvestigatorassignment").getValue() == 621870000) {
            if (tab) {
                tab.setVisible(true);
            }
        }
        else {
            tab.setVisible(false);
        }
    },

    referToInvestigationRoleCheck: function (PrimaryControl) {
        /*
        Enable the button for below roles
        - System Administrator
        - System Customizer
        - Certifications - Manager of Certifications Role
        - Certifications - Operations Supervisor Program Support Role
        - Certification - Operations Supervisor Assessment Role
        - Certification - Team Lead Role
        */
        var roles = ["System Administrator", "System Customizer", "Certifications - Manager of Certifications Role", "Certifications - Operations Supervisor Program Support Role", "Certification - Operations Supervisor Assessment Role", "Certification - Team Lead Role"];
        var hasRole = false;

        // Retrieving Global Context
        var context = Xrm.Utility.getGlobalContext();

        // Store Security Roles
        var loggedUserRoles = context.userSettings.roles;

        // Looping through user roles
        loggedUserRoles.forEach(function hasRoleName(item, index) {
            if (roles.indexOf(item.name) > -1) {
                hasRole = true;
            }
        });

        /* 
        Check formType
        0	Undefined
        1	Create
        2	Update
        3	Read Only
        4	Disabled
        6	Bulk Edit
        */
        if (PrimaryControl.ui.getFormType() != 2) {
            hasRole = false;
        }

        return hasRole;
    },

    showHideReasonForPriorityAssignment: function (executionContext) {
        var formContext = executionContext.getFormContext();

        // Recommend for Priority Assignment value
        var val = formContext.getAttribute("ecer_recommendforpriorityassignment").getValue();

        // val = Yes
        if (val == 621870000) {
            formContext.getControl("ecer_reasonforpriorityassignment").setVisible(true);
        }
        else {
            formContext.getControl("ecer_reasonforpriorityassignment").setVisible(false);
        }
    },
    // ECER-2772
    sendEmailToAgent: function (executionContext) {
        var formContext =
            executionContext && typeof executionContext.getFormContext === "function"
                ? executionContext.getFormContext()
                : executionContext;

        if (!formContext) {
            Xrm.Navigation.openAlertDialog({ text: "Form context not available." });
            return;
        }

        var agentVal = null;
        var attr = formContext.getAttribute("ecer_licensing_officers");
        if (attr) agentVal = attr.getValue();

        if (!agentVal || agentVal.length === 0) {
            var ctrl = formContext.getControl("ecer_licensing_officers");
            if (ctrl && ctrl.getAttribute) agentVal = ctrl.getAttribute().getValue();
        }

        if (!agentVal || agentVal.length === 0) {
            var attrs = formContext.data.entity.attributes.get();
            for (var i = 0; i < attrs.length; i++) {
                try {
                    if (
                        attrs[i].getAttributeType &&
                        attrs[i].getAttributeType() === "lookup"
                    ) {
                        var v = attrs[i].getValue();
                        if (
                            v &&
                            v.length &&
                            v[0].entityType === "ecer_licensing_officers"
                        ) {
                            agentVal = v;
                            break;
                        }
                    }
                } catch (e) {
                    /* ignore */
                }
            }
        }

        if (!agentVal || agentVal.length === 0) {
            Xrm.Navigation.openAlertDialog({ text: "Select an Agent first." });
            return;
        }

        var agentId = agentVal[0].id.replace(/[{}]/g, "");
        var agentName = agentVal[0].name;

        var invId = formContext.data.entity.getId().replace(/[{}]/g, "");
        var invName =
            (formContext.getAttribute("ecer_name") &&
                formContext.getAttribute("ecer_name").getValue()) ||
            "Investigation";
        var invLogical = formContext.data.entity.getEntityName();

        var getInvMeta = Xrm.Utility.getEntityMetadata(invLogical);
        var getAgentMeta = Xrm.Utility.getEntityMetadata("ecer_licensing_officers");

        Promise.all([getInvMeta, getAgentMeta])
            .then(function (md) {
                var invSet = md[0].EntitySetName;
                var agentSet = md[1].EntitySetName;

                var emailCreate = { subject: "" };

                emailCreate["regardingobjectid_" + invLogical + "@odata.bind"] =
                    "/" + invSet + "(" + invId + ")";

                var toParty = {};
                toParty["partyid_ecer_licensing_officers@odata.bind"] =
                    "/" + agentSet + "(" + agentId + ")";
                toParty["participationtypemask"] = 2;

                var fromParty = {};
                var userId = Xrm.Utility.getGlobalContext().userSettings.userId.replace(
                    /[{}]/g,
                    ""
                );
                fromParty["partyid_systemuser@odata.bind"] =
                    "/systemusers(" + userId + ")";
                fromParty["participationtypemask"] = 1;

                emailCreate["email_activity_parties"] = [toParty, fromParty];

                return Xrm.WebApi.createRecord("email", emailCreate);
            })
            .then(function (res) {
                Xrm.Navigation.openForm({
                    entityName: "email",
                    entityId: res.id,
                    useQuickCreateForm: false,
                });
            })
            .catch(function (err) {
                var msg =
                    err && err.message
                        ? err.message
                        : err && err.error && err.error.message
                            ? err.error.message
                            : JSON.stringify(err);
                Xrm.Navigation.openAlertDialog({
                    text: "Failed to create email: " + msg,
                });
            });
    },
};


ECER.Jscripts.Investigation.Data = {

    CertificationHierarchy: function () {
        return {
            Level1: 'Assistant,ECE Assistant',
            Level2: 'ECE 1 YR',
            Level3: 'ECE 5 YR'
        }
    }
}// JavaScript source code
