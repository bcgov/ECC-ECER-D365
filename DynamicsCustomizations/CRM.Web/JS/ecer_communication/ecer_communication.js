﻿// Javascript source code

if (typeof ECER === "undefined") {
    var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {}
}

ECER.Jscripts.Communication = {
    crm_ExecutionContext: null,
    onLoad: function (executionContext) {
        this.crm_ExecutionContext = executionContext;
        ECER.Jscripts.Communication.populateInitiatedFromAtForm(executionContext);
        ECER.Jscripts.Communication.lockIsRoot(executionContext);
        ECER.Jscripts.Communication.acknowledgedIfFromPortalUser(executionContext);
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
                formContext.data.save();
            }
        }
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
                            text = currentDetailsValue + "<br /><br />" + details;
                        }

                        formContext.getAttribute(nameAttributeName).setValue(name);
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


