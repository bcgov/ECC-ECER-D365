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
    onLoad: function (executionContext) {
        this.crm_ExecutionContext = executionContext;
        try {
            ECER.Jscripts.Communication.populateInitiatedFromAtForm(executionContext);
            ECER.Jscripts.Communication.lockIsRoot(executionContext);
            ECER.Jscripts.Communication.acknowledgedIfFromPortalUser(executionContext);
            var formContext = executionContext.getFormContext();
            var formType = formContext.ui.getFormType();
            var createMode = (formType === 1);
            if (!createMode) {
                ECER.Jscripts.Communication.loadRelatedObjects(executionContext);
            }
        }
        catch (ex) {
            // Do Nothing.  Mysterious issue when trying to save with No Dirty Fields
            // Throws script error of method not found when hitting "Save" multiple times.
        }
    },

    loadRelatedObjects: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var applicationAttributeName = "ecer_applicationid";
        var investigationAttributeName = "ecer_investigation";
        var registrantAttributeName = "ecer_registrantid";
        var transcriptAttributeName = "ecer_transcriptid";
        var portalUserLookup = formContext.getAttribute(registrantAttributeName);
        var applicationLookup = formContext.getAttribute(applicationAttributeName);
        var investigationLookup = formContext.getAttribute(investigationAttributeName);
        var transcriptLookup = formContext.getAttribute(transcriptAttributeName);

        if (portalUserLookup !== null && portalUserLookup.getValue() !== null) {
            var portalUserId = portalUserLookup.getValue()[0].id.toLowerCase().replace("{", "").replace("}", "");
            Xrm.WebApi.retrieveRecord("contact", portalUserId).then(
                function success(record) {
                    this.ecer_portaluser = record;
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

    acknowledgedIfFromPortalUser: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var initiatedFromAttributeName = "ecer_initiatedfrom";
        var flagAttributeName = "ecer_acknowledged";
        var initiatedFromAttribute = formContext.getAttribute(initiatedFromAttributeName);
        var theFlagAttribute = formContext.getAttribute(flagAttributeName);
        if (initiatedFromAttribute !== null && initiatedFromAttribute.getValue() === 621870002) {
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
        var applicationValue = formContext.getAttribute(applicationAttributeName).getValue();
        var investigationValue = formContext.getAttribute(investigationAttributeName).getValue();
        var portalUserValue = formContext.getAttribute(registrantAttributeName).getValue();
        var transcriptValue = formContext.getAttribute(transcriptAttributeName).getValue();
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


