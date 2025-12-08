// Javascript source code

if (typeof ECER === "undefined") {
    var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {}
}

ECER.Jscripts.Communication = {
    crm_ExecutionContext: null,
    ecer_application: null,
    ecer_investigation: null,
    ecer_portaluser: null,
    ecer_programapplicaiton: null,
    ecer_transcript: null,
    ecer_educationinstitution: null,
    ecer_program: null,
    ecer_icraeligibilityassessment: null,
    ecer_reconsiderationrequest: null,
    ecer_pspreferral: null,
    ecer_eceprogramrepresentative: null,
    parameters: null,
    isreply: false,
    onLoad: function (executionContext) {
        this.crm_ExecutionContext = executionContext;
        try {
            var globalContext = Xrm.Utility.getGlobalContext();

            this.parameters = globalContext.getQueryStringParameters();
            var par = globalContext.getQueryStringParameters();

            // Get the original Communication ID
            this.isreply = this.parameters["IsR"];
            if (this.isreply) {
                ECER.Jscripts.Communication.loadReplyMessage(executionContext);
                return;
            }
            ECER.Jscripts.Communication.populateInitiatedFromAtForm(executionContext);
            ECER.Jscripts.Communication.lockIsRoot(executionContext);
            ECER.Jscripts.Communication.acknowledgedIfFromPortalUser(executionContext);
            var formContext = executionContext.getFormContext();
            var formType = formContext.ui.getFormType();
            var createMode = (formType === 1);
            if (!createMode) {
                ECER.Jscripts.Communication.loadRelatedObjects(executionContext);
                ECER.Jscripts.Communication.setMergeInstructionValue(executionContext);
            }
            if (createMode) {
                ECER.Jscripts.Communication.loadPSPreferalDetails(executionContext);
            }
        }
        catch (ex) {
            // Do Nothing.  Mysterious issue when trying to save with No Dirty Fields
            // Throws script error of method not found when hitting "Save" multiple times.
        }
    },

    loadPSPreferalDetails: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var formType = formContext.ui.getFormType();
        var createMode = (formType == 1);
        var pspreferalAttributeName = "ecer_pspreferral";
        var pspreferalAttribute = formContext.getAttribute(pspreferalAttributeName);
        if (!pspreferalAttribute || !pspreferalAttribute.getValue())
            return;
        var pspReferralId = pspreferalAttribute.getValue()[0].id.toLowerCase().replace("{", "").replace("}", "");

        Xrm.WebApi.retrieveRecord("ecer_pspreferral", pspReferralId).then(
            function success(record) {

                var applicationAttributename = "ecer_applicationid";
                var transcriptAttributename = "ecer_transcriptid";

                var applicationId = record["_ecer_application_value"];
                var transcriptId = record["_ecer_educationtranscript_value"];

                if (applicationId) {
                    var applicationLookup = crm_Utility.generateLookupObject("ecer_application", applicationId, record["_ecer_application_value@OData.Community.Display.V1.FormattedValue"]);
                    crm_Utility.setLookupValue(executionContext, applicationAttributename, applicationLookup);

                }
                if (transcriptId) {
                    var transcriptLookup = crm_Utility.generateLookupObject("ecer_transcript", transcriptId, record["_ecer_educationtranscript_value@OData.Community.Display.V1.FormattedValue"]);
                    crm_Utility.setLookupValue(executionContext, transcriptAttributename, transcriptLookup);

                }
            }
        );
    },


    loadReplyMessage: function(executionContext) {
        var initiatedFromAttributeName = "ecer_initiatedfrom";
        var parentCommunicationAttributeName = "ecer_parentcommunicationid";
        var portalUserAttributeName = "ecer_registrantid";
        var programApplicatAttributeName = "ecer_ecer_program_application_id";
        var educationalTranscriptAttributeName = "ecer_transcriptid";

        var formContext = executionContext.getFormContext();
        formContext.getControl("ecer_donotreply").setDisabled(true);
        formContext.getControl("ecer_isroot").setDisabled(true);

        var intiatedFrom = ECER.Jscripts.Communication.getInitiatedFromParentCommunicatiion(executionContext, this.parameters["parentCommunication"][0].id);

        formContext.getAttribute("ecer_applicationid").setValue(this.parameters["applicationValue"]);
        formContext.getAttribute("ecer_investigation").setValue(this.parameters["investigationValue"]);
        formContext.getAttribute("ecer_parentcommunicationid").setValue(this.parameters["parentCommunication"]);
        formContext.getAttribute("ecer_registrantid").setValue(this.parameters["portalUserValue"]);
        formContext.getAttribute("ecer_transcriptid").setValue(this.parameters["transcriptValue"]);
        formContext.getAttribute("ecer_ecer_program_application_id").setValue(this.parameters["programApplicat"]);
        formContext.getAttribute("ecer_initiatedfrom").setValue(intiatedFrom);
        // There is a classic workflow populating these relationship using Parent Communication already
    },
    showSubgridDisplay: function(selectedMessage) {

        show = false;
        if (selectedMessage.length !== 0) {
            var option = "?$filter= ecer_communicationid eq '" + selectedMessage + "'";
            var results = crm_Utility.retrieveMultipleCustom("ecer_communication", option); // Synchoronous call using AJAX.  The await throws error.

            if (results !== null || results.length !== 0) {


                if ((results[0]["ecer_initiatedfrom"] === 621870002) && (!results[0]["ecer_donotreply"]) && (!results[0]["ecer_isroot"])) {
                    show = true;
                }

            }

        }
        return show;
    },
    getInitiatedFromParentCommunicatiion: function(executionContext, parentCommunication) {
        if (parentCommunication) {

            var parentCommunicationId = parentCommunication.replace("{", "").replace("}", "");
            var initiatedFromAttributeName = "ecer_initiatedfrom"

            var option = "?$filter= ecer_communicationid eq '" + parentCommunicationId + "'";
            var results = crm_Utility.retrieveMultipleCustom("ecer_communication", option); // Synchoronous call using AJAX.  The await throws error.

            if (results !== null || results.length !== 0) {
                return results[0][initiatedFromAttributeName];
            }
            else {
                return null;
            }

        }

    },


    loadRelatedObjects: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var applicationAttributeName = "ecer_applicationid";
        var investigationAttributeName = "ecer_investigation";
        var registrantAttributeName = "ecer_registrantid";
        var transcriptAttributeName = "ecer_transcriptid";
        var educationalInstitutionAttributeName = "ecer_educationinstitutionid";
        var programProfileAttributeName = "ecer_programprofileid";
        var icraAssessmentAttributeName = "ecer_icraeligibilityassessmentid";
        var reconsiderationRequestAttributeName = "ecer_reconsiderationrequestid";
        var programApplicationAttributeName = "ecer_ecer_program_application_id";
        var pspRefferralAttributeName = "ecer_pspreferral";
        var programRepAttributeName = "ecer_programrepresentativeid";

        var portalUserLookup = formContext.getAttribute(registrantAttributeName);
        var applicationLookup = formContext.getAttribute(applicationAttributeName);
        var investigationLookup = formContext.getAttribute(investigationAttributeName);
        var transcriptLookup = formContext.getAttribute(transcriptAttributeName);
        var psiLookup = formContext.getAttribute(educationalInstitutionAttributeName);
        var programLookup = formContext.getAttribute(programProfileAttributeName);
        var icraAssessmentLookup = formContext.getAttribute(icraAssessmentAttributeName);
        var reconsiderationLookup = formContext.getAttribute(reconsiderationRequestAttributeName);
        var programApplicationLookup = formContext.getAttribute(programApplicationAttributeName);
        var pspReferralLookup = formContext.getAttribute(pspRefferralAttributeName);
        var programRefLookup = formContext.getAttribute(programRepAttributeName);


        if (portalUserLookup !== null && portalUserLookup.getValue() !== null) {
            var portalUserId = portalUserLookup.getValue()[0].id.toLowerCase().replace("{", "").replace("}", "");
            Xrm.WebApi.retrieveRecord("contact", portalUserId).then(
                function success(record) {
                    this.ecer_portaluser = record;
                }
            );
        }

        if (programRefLookup !== null && programRefLookup.getValue() !== null) {
            var programRepId = programRefLookup.getValue()[0].id.toLowerCase().replace("{", "").replace("}", "");
            Xrm.WebApi.retrieveRecord("ecer_eceprogramrepresentative", programRepId).then(
                function success(record) {
                    this.ecer_eceprogramrepresentative = record;
                }
            );
        }

        if (programApplicationLookup !== null && programApplicationLookup.getValue() !== null) {
            var programApplicationId = programApplicationLookup.getValue()[0].id.toLowerCase().replace("{", "").replace("}", "");
            Xrm.WebApi.retrieveRecord("ecer_postsecondaryinstituteprogramapplicaiton", programApplicationId).then(
                function success(record) {
                    this.ecer_programapplicaiton = record;
                }
            );
        }

        if (pspReferralLookup !== null && pspReferralLookup.getValue() !== null) {
            var pspReferralId = pspReferralLookup.getValue()[0].id.toLowerCase().replace("{", "").replace("}", "");
            Xrm.WebApi.retrieveRecord("ecer_pspreferral", pspReferralId).then(
                function success(record) {
                    this.ecer_pspreferral = record;
                }
            );
        }

        if (reconsiderationLookup !== null && reconsiderationLookup.getValue() !== null) {
            var reconsiderationId = reconsiderationLookup.getValue()[0].id.toLowerCase().replace("{", "").replace("}", "");
            Xrm.WebApi.retrieveRecord("ecer_reconsiderationrequest", reconsiderationId).then(
                function success(record) {
                    this.ecer_reconsiderationrequest = record;
                }
            );
        }

        if (icraAssessmentLookup !== null && icraAssessmentLookup.getValue() !== null) {
            var icraAssessmentId = icraAssessmentLookup.getValue()[0].id.toLowerCase().replace("{", "").replace("}", "");
            Xrm.WebApi.retrieveRecord("ecer_icraeligibilityassessment", icraAssessmentId).then(
                function success(record) {
                    this.ecer_icraeligibilityassessment = record;
                }
            );
        }

        if (psiLookup !== null && psiLookup.getValue() !== null) {
            var psiId = psiLookup.getValue()[0].id.toLowerCase().replace("{", "").replace("}", "");
            Xrm.WebApi.retrieveRecord("ecer_postsecondaryinstitute", psiId).then(
                function success(record) {
                    this.ecer_educationinstitution = record;
                }
            );
        }

        if (programLookup !== null && programLookup.getValue() !== null) {
            var programProfileId = programLookup.getValue()[0].id.toLowerCase().replace("{", "").replace("}", "");
            Xrm.WebApi.retrieveRecord("ecer_program", programProfileId).then(
                function success(record) {
                    this.ecer_program = record;
                }
            );
        }

        if (applicationLookup !== null && applicationLookup.getValue() !== null) {
            var applicaitonId = applicationLookup.getValue()[0].id.toLowerCase().replace("{", "").replace("}", "");
            Xrm.WebApi.retrieveRecord("ecer_application", applicaitonId).then(
                function success(record) {
                    this.ecer_application = record;
                }
            );
        }

        if (investigationLookup !== null && investigationLookup.getValue() !== null) {
            var investigationId = investigationLookup.getValue()[0].id.toLowerCase().replace("{", "").replace("}", "");
            Xrm.WebApi.retrieveRecord("ecer_investigation", investigationId).then(
                function success(record) {
                    this.ecer_investigation = record;
                }
            );
        }

        if (transcriptLookup !== null && transcriptLookup.getValue() !== null) {
            var transcriptId = transcriptLookup.getValue()[0].id.toLowerCase().replace("{", "").replace("}", "");
            Xrm.WebApi.retrieveRecord("ecer_transcript", transcriptId).then(
                function success(record) {
                    this.ecer_transcript = record;
                }
            )
        }
    },

    lockIsRoot: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var formType = formContext.ui.getFormType();
        var createMode = (formType == 1);
        var isRootAttributeName = "ecer_isroot";
        var parentCommunicationAttributeName = "ecer_parentcommunicationid";
        var isRootControl = formContext.getControl(isRootAttributeName);
        var isRootAttribute = formContext.getAttribute(isRootAttributeName);
        var isChildRecord = false;
        var parentCommunicationAttribute = formContext.getAttribute(parentCommunicationAttributeName);
        if (parentCommunicationAttribute !== null && parentCommunicationAttribute.getValue() != null) {
            isChildRecord = true;
        }

        // Is Root Should be locked if NOT Create Mode or Parent Communication already contains data (This is copy over by entity mapping)
        var lock = !createMode || isChildRecord;
        isRootControl.setDisabled(lock);
        if (createMode) {
            isRootAttribute.setValue(!isChildRecord);
        }
    },

    onSendButtonClick: function () {
        // ECER-2344
        // On click of Send Button, set ecer_notifyrecipient to TRUE and save record
        var formContext = this.crm_ExecutionContext.getFormContext();
        var attributeName = "ecer_notifyrecipient";
        var theAttribute = formContext.getAttribute(attributeName);
        theAttribute.setValue(true);
        theAttribute.setSubmitMode("always");
        formContext.data.save();
    },
    onSubGridReplyButtonClick: function (selectedMessage) {
        // ECER-4585

        var option = "?$filter= ecer_communicationid eq '" + selectedMessage + "'";
        var results = crm_Utility.retrieveMultipleCustom("ecer_communication", option); // Synchoronous call using AJAX.  The await throws error.

        if (results !== null || results.length !== 0) {

            var applicationAttributeName = "_ecer_applicationid_value";
            var investigationAttributeName = "_ecer_investigation_value";
            var registrantAttributeName = "_ecer_registrantid_value";
            var transcriptAttributeName = "_ecer_transcriptid_value";
            var initiatedFromAttributeName = "ecer_initiatedfrom";
            var parentCommunicationAttributeName = "_ecer_parentcommunicationid_value";
            var programApplicatAttributeName = "_ecer_ecer_program_application_id_value";
            var educationalTranscriptAttributeName = "_ecer_transcriptid_value";


            var applicationValue = results[0][applicationAttributeName];
            var investigationValue = results[0][investigationAttributeName];
            var portalUserValue = results[0][registrantAttributeName];
            var transcriptValue = results[0][transcriptAttributeName];
            var parentCommunication = results[0][parentCommunicationAttributeName];
            var programApplicat = results[0][programApplicatAttributeName];
            var educationalTranscript = results[0][educationalTranscriptAttributeName];
            var parentCommunicationLookup = null;
            var applicationLookup = null;
            var transcriptLookup = null;
            var investigationLookup = null;
            var programApplicatLookup = null;

            if (parentCommunication !== null) {
                var parentCommuName = ECER.Jscripts.Communication.returnLookupField("ecer_communication", "ecer_communicationid", parentCommunication, "ecer_name");

                parentCommunicationLookup = [{
                    id: parentCommunication,
                    name: parentCommuName,
                    entityType: "ecer_communication"
                }
                ]
            }
            if (investigationValue !== null) {
                var investigationName = ECER.Jscripts.Communication.returnLookupField("ecer_investigation", "ecer_investigationid", investigationValue, "ecer_name");

                investigationLookup = [{
                    id: investigationValue,
                    name: investigationName,
                    entityType: "ecer_investigation"
                }
                ]
            }

            if (applicationValue !== null) {
                var applicationName = ECER.Jscripts.Communication.returnLookupField("ecer_application", "ecer_applicationid", applicationValue, "ecer_name");

                applicationLookup = [{
                    id: applicationValue,
                    name: applicationName,
                    entityType: "ecer_application"
                }
                ]
            }
            if (portalUserValue !== null) {
                var portalUserName = ECER.Jscripts.Communication.returnLookupField("contact", "contactid", portalUserValue, "fullname");

                portalUserLookup = [{
                    id: portalUserValue,
                    name: portalUserName,
                    entityType: "contact"
                }
                ]
            }
            if (transcriptValue !== null) {
                var applicationName = ECER.Jscripts.Communication.returnLookupField("ecer_transcript", "ecer_transcriptid", transcriptValue, "ecer_name");

                transcriptLookup = [{
                    id: transcriptValue,
                    name: applicationName,
                    entityType: "ecer_transcript"
                }
                ]
            }
            if (programApplicat !== null) {
                var programApplicantName = ECER.Jscripts.Communication.returnLookupField("ecer_postsecondaryinstituteprogramapplicaiton", "ecer_postsecondaryinstituteprogramapplicaitonid", programApplicat, "ecer_name");

                programApplicatLookup = [{
                    id: programApplicat,
                    name: programApplicantName,
                    entityType: "ecer_postsecondaryinstituteprogramapplicaiton"
                }
                ]
            }


            var entityName = "ecer_communication";

            var pageInput = {
                pageType: "entityrecord",
                entityName: entityName,
                formType: 2,
                data: {

                    IsR: 'true',
                    applicationValue: applicationLookup,
                    investigationValue: investigationLookup,
                    portalUserValue: portalUserLookup,
                    transcriptValue: transcriptLookup,
                    parentCommunication: parentCommunicationLookup,
                    programApplicat: programApplicatLookup,
                    educationalTranscript: transcriptLookup

                }

            };

            var navigationOptions = {
                target: 1, // Open as a modal dialog
                //width: 800,
                //height: 600
            };

            Xrm.Navigation.navigateTo(pageInput, navigationOptions).then(
                function () {
                    console.log("Reply Form opened successfully.");
                },
                function (error) {
                    console.log("Error opening Reply Form: " + error.message);
                }
            );


        }
        else {
            console.log("Error");
        }



    },

    returnLookupField(entity, colname, entityid, name) {
        var option = "?$filter= " + colname + " eq '" + entityid + "' &$select=" + name;
        var results = crm_Utility.retrieveMultipleCustom(entity, option);


        return results[0][name];
    },

    onReplyButtonClick: function (executionContext) {
        // ECER-4585

        var applicationAttributeName = "ecer_applicationid";
        var formContext = null;
        if (this.crm_ExecutionContext !== null) {
            formContext = this.crm_ExecutionContext.getFormContext();
        }
        else {
            formContext = executionContext;
        }

        var investigationAttributeName = "ecer_investigation";
        var registrantAttributeName = "ecer_registrantid";
        var transcriptAttributeName = "ecer_transcriptid";
        var initiatedFromAttributeName = "ecer_initiatedfrom";
        var parentCommunicationAttributeName = "ecer_parentcommunicationid";
        var programApplicatAttributeName = "ecer_ecer_program_application_id";
        var educationalTranscriptAttributeName = "ecer_transcriptid";

        var applicationValue = formContext.getAttribute(applicationAttributeName).getValue();
        var investigationValue = formContext.getAttribute(investigationAttributeName).getValue();
        var portalUserValue = formContext.getAttribute(registrantAttributeName).getValue();
        var transcriptValue = formContext.getAttribute(transcriptAttributeName).getValue();
        var parentCommunication = formContext.getAttribute(parentCommunicationAttributeName).getValue();
        var programApplicat = formContext.getAttribute(programApplicatAttributeName).getValue();
        var educationalTranscript = formContext.getAttribute(educationalTranscriptAttributeName).getValue();


        var entityName = "ecer_communication";

        var pageInput = {
            pageType: "entityrecord",
            entityName: entityName,
            formType: 2,
            data: {

                IsR: 'true',
                communicationid: formContext.data.entity.getId(),
                applicationValue: applicationValue,
                investigationValue: investigationValue,
                portalUserValue: portalUserValue,
                transcriptValue: transcriptValue,
                parentCommunication: parentCommunication,
                programApplicat: programApplicat,
                educationalTranscript: educationalTranscript

            }

        };

        var navigationOptions = {
            target: 1, // Open as a modal dialog
            //width: 800,
            //height: 600
        };

        Xrm.Navigation.navigateTo(pageInput, navigationOptions).then(
            function () {
                console.log("Reply Form opened successfully.");
            },
            function (error) {
                console.log("Error opening Reply Form: " + error.message);
            }
        );



    },
    acknowledgedIfFromPortalUser: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var initiatedFromAttributeName = "ecer_initiatedfrom";
        var flagAttributeName = "ecer_acknowledged";
        var initiatedFromAttribute = formContext.getAttribute(initiatedFromAttributeName);
        var theFlagAttribute = formContext.getAttribute(flagAttributeName);
        if (initiatedFromAttribute !== null
            && (initiatedFromAttribute.getValue() === 621870002 || // Portal User
            initiatedFromAttribute.getValue() === 621870003)) { // Program Representative
            // If Initiated From Portal User
            if (theFlagAttribute !== null && theFlagAttribute.getValue() !== true) {
                // If the Acknowledged Flag is FALSE
                theFlagAttribute.setValue(true);
                theFlagAttribute.setSubmitMode("always");
                formContext.data.save();
            }
        }
    },

    dateMerge: function (currentDetailsValue) {
        if (currentDetailsValue === null) {
            currentDetailsValue = "";
        }
        var today = new Date();
        var dateDisplayOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        // Date or Today
        currentDetailsValue = currentDetailsValue.replace("[Date]", today.toLocaleDateString('en-US', dateDisplayOptions));
        currentDetailsValue = currentDetailsValue.replace("[Today]", today.toLocaleDateString('en-US', dateDisplayOptions));
        currentDetailsValue = currentDetailsValue.replace("[DATE]", today.toLocaleDateString('en-US', dateDisplayOptions));
        currentDetailsValue = currentDetailsValue.replace("[TODAY]", today.toLocaleDateString('en-US', dateDisplayOptions));

        return currentDetailsValue;
    },

    shortDateToLongDateString: function (shortDateString) {
        if (shortDateString === undefined ||
            shortDateString === null ||
            shortDateString.trim() === "" ||
            Number.isNaN(Number(shortDateString.replace("-", "")))) {
            // Date should be in 2024-08-14
            // isNaN SPOJ the input parameter has to be parsed as Number and then it will return NaN
            return shortDateString;
        }
        else {
            var dateTimeStamp = Date.parse(shortDateString);
            if (Number.isNaN(dateTimeStamp)) {
                return shortDateString;
            }
            else {
                var dateDisplayOptions = {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                };
                var date = new Date(dateTimeStamp);
                return date.toLocaleDateString('en-US', dateDisplayOptions);
            }
        }
    },

    fieldMerge: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var detailsAttributeName = "ecer_message";
        var currentDetailsAttribute = formContext.getAttribute(detailsAttributeName);
        var currentDetailsValue = currentDetailsAttribute.getValue();
        if (currentDetailsValue === null || currentDetailsValue.trim() === "") {
            return; // No Contents to merge
        }

        var formType = formContext.ui.getFormType();
        if (formType == 1) {
            // If Still in Create Mode.  save the record first otherwise it throws error.
            formContext.data.save();
        }

        currentDetailsValue = ECER.Jscripts.Communication.dateMerge(currentDetailsValue);
        var index = -1
        index = currentDetailsValue.indexOf("[", index);
        if (index === -1) {
            return; // No Merge Fields
        }
        index = -1;
        var hasIssue = false;
        do {
            var matches = currentDetailsValue.match(/\[(.*?)\]/);
            index = currentDetailsValue.indexOf("[", index) + 1; // Increment to avoid infinite loop
            matches.forEach(function (item) {
                var originalText = item;
                if (originalText.indexOf("[") >= 0) {
                    // All Schema should be in lowercase
                    var text = originalText.replace("[", "").replace("]", "").toLowerCase();
                    // Split the field
                    var splitEntityField = text.split(".");
                    var fieldText;
                    var entityName;
                    var childEntityName;
                    var childEntityFilterFieldName;
                    var childFieldName;
                    var fieldName;
                    if (splitEntityField.length == 2) {
                        // Sample: [contact.fullname];
                        entityName = splitEntityField[0];
                        fieldName = splitEntityField[1];

                        switch (entityName) {
                            case "contact":
                                fieldText = ECER.Jscripts.Communication.shortDateToLongDateString(this.ecer_portaluser[fieldName]);
                                break;
                            case "ecer_application":
                                fieldText = ECER.Jscripts.Communication.shortDateToLongDateString(this.ecer_application[fieldName]);
                                break;
                            case "ecer_investigation":
                                fieldText = ECER.Jscripts.Communication.shortDateToLongDateString(this.ecer_investigation[fieldName]);
                                break;
                            case "ecer_transcript":
                                fieldText = ECER.Jscripts.Communication.shortDateToLongDateString(this.ecer_transcript[fieldName]);
                                break;
                            case "ecer_program":
                                fieldText = ECER.Jscripts.Communication.shortDateToLongDateString(this.ecer_program[fieldName]);
                                break;
                            case "ecer_postsecondaryinstitute":
                                fieldText = ECER.Jscripts.Communication.shortDateToLongDateString(this.ecer_educationinstitution[fieldName]);
                                break;
                            case "ecer_postsecondaryinstituteprogramapplicaiton":
                                fieldText = ECER.Jscripts.Communication.shortDateToLongDateString(this.ecer_programapplicaiton[fieldName]);
                                break;
                            case "ecer_icraeligibilityassessment":
                                fieldText = ECER.Jscripts.Communication.shortDateToLongDateString(this.ecer_icraeligibilityassessment[fieldName]);
                                break;
                            case "ecer_reconsiderationrequest":
                                fieldText = ECER.Jscripts.Communication.shortDateToLongDateString(this.ecer_reconsiderationrequest[fieldName]);
                                break;
                            case "ecer_pspreferral":
                                fieldText = ECER.Jscripts.Communication.shortDateToLongDateString(this.ecer_pspreferral[fieldName]);
                                break;
                            case "ecer_eceprogramrepresentative":
                                fieldText = ECER.Jscripts.Communication.shortDateToLongDateString(this.ecer_eceprogramrepresentative[fieldName]);
                                break;
                        }
                        if (fieldText !== undefined) {
                            if (fieldText === null) {
                                fieldText = "";
                            }
                            currentDetailsValue = currentDetailsValue.replace(originalText, fieldText);
                        }
                        else {
                            crm_Utility.showMessage("Some field(s) schema name may not be correct.\n Entity: " + entityName +
                                "\n Entity Field Name(s): " + fieldName +
                                "\nPlease verify and try again.");
                            hasIssue = true;
                            return;
                        }
                    }
                    else {
                        entityName = splitEntityField[0];
                        childEntityName = splitEntityField[1];
                        childEntityFilterFieldName = splitEntityField[2];
                        childFieldName = splitEntityField[3];
                        var parentId = "";
                        switch (entityName) {
                            case "contact":
                                parentId = this.ecer_portaluser.contactid;
                                break;
                            case "ecer_application":
                                parentId = this.ecer_application.ecer_applicationid;
                                break;
                            case "ecer_investigation":
                                parentId = this.ecer_investigation.ecer_investigationid;
                                break;
                            case "ecer_transcript":
                                parentId = this.ecer_transcript.ecer_transcriptid;
                                break;
                            case "ecer_program":
                                parentId = this.ecer_program.ecer_programid;
                                break;
                            case "ecer_postsecondaryinstitute":
                                parentId = this.ecer_educationinstitution.ecer_postsecondaryinstituteid;
                                break;
                            case "ecer_postsecondaryinstituteprogramapplicaiton":
                                parentId = this.ecer_programapplicaiton.ecer_postsecondaryinstituteprogramapplicaitonid;
                                break;
                            case "ecer_icraeligibilityassessment":
                                parentId = this.ecer_icraeligibilityassessment.ecer_icraeligibilityassessmentid;
                                break;
                            case "ecer_reconsiderationrequest":
                                parentId = this.ecer_reconsiderationrequest.ecer_reconsiderationrequestid;
                                break;
                            case "ecer_pspreferral":
                                parentId = this.ecer_pspreferral.ecer_pspreferralid;
                                break;
                        }
                        var option = "?$filter=_" + childEntityFilterFieldName + "_value eq '" + parentId + "' and statecode eq 0&$select=" + childFieldName;
                        var results = crm_Utility.retrieveMultipleCustom(childEntityName, option); // Synchoronous call using AJAX.  The await throws error.
                        if (results == null) {
                            crm_Utility.showMessage("Some field(s) schema name may not be correct.\n Parent Entity: " + entityName +
                                "\n Child Entity: " + childEntityName +
                                "\n Filter Field Name: " + childEntityFilterFieldName +
                                "\n Child Entity Field Name(s): " + childFieldName +
                                "\nPlease verify and try again.");
                            hasIssue = true;
                            return;
                        }
                        else {
                            if (results.length === 0) {
                                fieldText = "No record found.";
                            }
                            else {
                                fieldText = "<ul>";
                                for (var i = 0; i < results.length; i++) {
                                    fieldText += "<li>";
                                    if (childFieldName.indexOf(",") == -1) {
                                        var childFieldValue = results[i][childFieldName];
                                        if (childFieldValue !== null && childFieldValue.trim() !== "") {
                                            fieldText += ECER.Jscripts.Communication.shortDateToLongDateString(childFieldValue);
                                        }
                                    }
                                    else {
                                        var fieldNameArray = childFieldName.split(",");
                                        for (var j = 0; j < fieldNameArray.length; j++) {
                                            var splitFieldName = fieldNameArray[j];
                                            var fieldValue = results[i][splitFieldName];
                                            if (fieldValue !== null && fieldValue.trim() !== "") {
                                                if (j !== 0) {
                                                    fieldText += " ";
                                                }
                                                fieldText += ECER.Jscripts.Communication.shortDateToLongDateString(fieldValue);
                                                fieldText += " ";
                                            }
                                        }
                                    }
                                    fieldText += "</li>";
                                }
                                fieldText += "</ul>";
                            }
                            if (fieldText !== undefined) {
                                currentDetailsValue = currentDetailsValue.replace(originalText, fieldText);
                            }
                        }
                    }
                }
            });
        }
        while (currentDetailsValue.indexOf("[", index) >= 0 && hasIssue == false);
        currentDetailsAttribute.setValue(currentDetailsValue);

    },

    populateOnPresetContentsSelected: function (executionContext) {
        // ECER.Jscripts.Communication.populateOnPresetContentsSelected
        var formContext = executionContext.getFormContext();
        var lookupAttributeName = "ecer_presetcontentsid";
        var nameAttributeName = "ecer_name";
        var detailsAttributeName = "ecer_message";
        var currentDetailsValue = formContext.getAttribute(detailsAttributeName).getValue();
        if (currentDetailsValue === null) {
            currentDetailsValue = "";
        }
        var lookupAttribute = formContext.getAttribute(lookupAttributeName);
        if (lookupAttribute != null) {
            var lookupValue = lookupAttribute.getValue();
            if (lookupValue != null) {
                var lookupId = lookupValue[0].id.toLowerCase().replace("{", "").replace("}", "");
                Xrm.WebApi.retrieveRecord("ecer_communicationcontent", lookupId).then(
                    function success(record) {
                        var name = record.ecer_name;
                        var subject = record.ecer_subject;
                        var details = record.ecer_text;
                        var text = details;
                        if (currentDetailsValue !== null && currentDetailsValue !== "") {
                            text = currentDetailsValue + details;
                        }

                        if (subject == null) {
                            subject = name;
                        }
                        var currentSubject = formContext.getAttribute(nameAttributeName).getValue();
                        // Only Populate if Empty
                        if (currentSubject === null || currentSubject.trim() === "") {
                            formContext.getAttribute(nameAttributeName).setValue(subject);
                        }
                        formContext.getAttribute(detailsAttributeName).setValue(null);
                        formContext.getAttribute(detailsAttributeName).setValue(text);
                    }
                );
            }
        }
    },

    setMergeInstructionValue: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var formType = formContext.ui.getFormType();
        if (formType !== 2) {
            return; // Only care if it were Update mode
        }
        var attributeName = "ecer_mergeinstruction";
        var instructionAttribute = formContext.getAttribute(attributeName);
        if (instructionAttribute === null || instructionAttribute.getValue() !== null) {
            return; // Ignore if attribute does not already exist or contains default value already.
        }
        var option = "?$filter=ecer_group eq 'Communication' and ecer_name eq 'Merge Instruction'&$select=ecer_multiplelineoftext";
        Xrm.WebApi.retrieveMultipleRecords("ecer_defaultcontents", option).then(
            function success(results) {
                if (results.entities.length !== 0) {
                    var contentsRecord = results.entities[0];
                    var fieldValue = contentsRecord.ecer_multiplelineoftext;
                    instructionAttribute.setValue(fieldValue);
                    instructionAttribute.fireOnChange();
                    formContext.data.save();
                }
            }
        );
    },

    populateInitiatedFromAtForm: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var formType = formContext.ui.getFormType();
        if (formType !== 1) {
            // only care if it were at Create mode
            return;
        }
        var applicationAttributeName = "ecer_applicationid";
        var investigationAttributeName = "ecer_investigation";
        var registrantAttributeName = "ecer_registrantid";
        var transcriptAttributeName = "ecer_transcriptid";
        var initiatedFromAttributeName = "ecer_initiatedfrom";
        var educationalInstitutionAttributeName = "ecer_educationinstitutionid";
        var applicationValue = formContext.getAttribute(applicationAttributeName).getValue();
        var investigationValue = formContext.getAttribute(investigationAttributeName).getValue();
        var portalUserValue = formContext.getAttribute(registrantAttributeName).getValue();
        var transcriptValue = formContext.getAttribute(transcriptAttributeName).getValue();
        // If we need to differentiate PSP and Registry in the future
        var educationalInstitutionValue = formContext.getAttribute(educationalInstitutionAttributeName).getValue();
        var initiatedFromAttribute = formContext.getAttribute(initiatedFromAttributeName);
        var initiatedFromRegistryValue = 621870000;
        var initiatedFromInvestigationValue = 621870001;
        if (investigationValue != null) {
            initiatedFromAttribute.setValue(initiatedFromInvestigationValue);
        }
        else if (applicationValue !== null || portalUserValue !== null || transcriptValue !== null) {
            initiatedFromAttribute.setValue(initiatedFromRegistryValue);
        }
        else {
            initiatedFromAttribute.setValue(initiatedFromRegistryValue);
        }

    }
}


