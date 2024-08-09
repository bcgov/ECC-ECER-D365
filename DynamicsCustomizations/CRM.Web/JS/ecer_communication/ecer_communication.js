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
        var portalUserLookup = formContext.getAttribute(registrantAttributeName);
        var applicationLookup = formContext.getAttribute(applicationAttributeName);
        var investigationLookup = formContext.getAttribute(investigationAttributeName);

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

        do {
            var matches = currentDetailsValue.match(/\[(.*?)\]/);
            var index = currentDetailsValue.indexOf("[", index) + 1; // Increment to avoid infinite loop
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
                                fieldText = this.ecer_portaluser[fieldName];
                                break;
                            case "ecer_application":
                                fieldText = this.ecer_application[fieldName];
                                break;
                            case "ecer_investigation":
                                fieldText = this.ecer_investigation[fieldName];
                                break;
                        }
                        if (fieldText !== undefined) {
                            currentDetailsValue = currentDetailsValue.replace(originalText, fieldText);

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
                        }
                        var option = "?$filter=_" + childEntityFilterFieldName + "_value eq '" + parentId + "' and statecode eq 0&$select=" + childFieldName;
                        var results = crm_Utility.retrieveMultipleCustom(childEntityName, option); // Synchoronous call using AJAX.  The await throws error.
                        fieldText = "<ul>";
                        for (var i = 0; i < results.length; i++) {
                            fieldText += "<li>" + results[i][childFieldName] + "</li>";
                        }
                        fieldText += "</ul>";
                        if (fieldText !== undefined) {
                            currentDetailsValue = currentDetailsValue.replace(originalText, fieldText);
                        }

                    }
                }
            });
        }
        while (currentDetailsValue.indexOf("[", index) >= 0);
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
                        var details = record.ecer_text;
                        var text = details;
                        if (currentDetailsValue !== null && currentDetailsValue !== "") {
                            text = details + currentDetailsValue;
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
        var initiatedFromAttributeName = "ecer_initiatedfrom";
        var applicationValue = formContext.getAttribute(applicationAttributeName).getValue();
        var investigationValue = formContext.getAttribute(investigationAttributeName).getValue();
        var portalUserValue = formContext.getAttribute(registrantAttributeName).getValue();
        var initiatedFromAttribute = formContext.getAttribute(initiatedFromAttributeName);
        var initiatedFromRegistryValue = 621870000;
        var initiatedFromInvestigationValue = 621870001;
        if (investigationValue != null) {
            initiatedFromAttribute.setValue(initiatedFromInvestigationValue);
        }
        else if (applicationValue !== null || portalUserValue !== null) {
            initiatedFromAttribute.setValue(initiatedFromRegistryValue);
        }

    }
}


