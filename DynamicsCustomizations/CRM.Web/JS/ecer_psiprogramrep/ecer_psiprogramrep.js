if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.PSIProgramRep =
{
    onLoad: function (executionContext) {
        ECER.Jscripts.PSIProgramRep.showHideManageUsers(executionContext);
        ECER.Jscripts.PSIProgramRep.resetHasChangedByProgramRepFlagIfProgramAnalyst(executionContext);
        ECER.Jscripts.PSIProgramRep.resetNewPortalUserFlagIfProgramAnalyst(executionContext);
    },
    showHideManageUsers: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var tab = formContext.ui.tabs.get("tab_manageusers");
        // If Representative Role is Primary
        if (formContext.getAttribute("ecer_representativerole").getValue() == 621870000) {
            if (tab) {
                tab.setVisible(true);
            }
        }
        else {
            tab.setVisible(false);
        }
    },
    resetHasChangedByProgramRepFlagIfProgramAnalyst: function (executionContext) {
        // ECER.Jscripts.PSIProgramRep.resetHasChangedByProgramRepFlagIfProgramAnalyst
        // ECER-5522
        var pspBaselineRole = crm_Utility.checkCurrentUserRole("PSP - Baseline Role");

        if (pspBaselineRole) {
            var formContext = executionContext.getFormContext();
            var hasChangedByProgramRepAttributeName = "ecer_haschangedbyprogramrep";
            var hasChangedByProgramRepAttribute = formContext.getAttribute(hasChangedByProgramRepAttributeName);
            if (hasChangedByProgramRepAttribute != null &&
                hasChangedByProgramRepAttribute.getValue() != null &&
                hasChangedByProgramRepAttribute.getValue() == true) {
                hasChangedByProgramRepAttribute.setValue(false);
                hasChangedByProgramRepAttribute.fireOnChange();
            }
        }
    },
    resetNewPortalUserFlagIfProgramAnalyst: function (executionContext) {
        // ECER.Jscripts.PSIProgramRep.resetNewPortalUserFlagIfProgramAnalyst
        // ECER-5522
        var pspBaselineRole = crm_Utility.checkCurrentUserRole("PSP - Baseline Role");
        
        if (pspBaselineRole) {
            var formContext = executionContext.getFormContext();
            var newPortalUserAttributeName = "ecer_newportaluser";
            var newPortalUserAttribute = formContext.getAttribute(newPortalUserAttributeName);
            if (newPortalUserAttribute != null &&
                newPortalUserAttribute.getValue() != null &&
                newPortalUserAttribute.getValue() == true) {
                newPortalUserAttribute.setValue(false);
                newPortalUserAttribute.fireOnChange();
            }
        }
    }
}