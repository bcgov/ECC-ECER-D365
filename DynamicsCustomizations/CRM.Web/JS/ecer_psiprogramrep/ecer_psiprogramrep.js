if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.PSIProgramRep =
{
    onLoad: function (executionContext) {
        var formContext = executionContext.getFormContext();

        ECER.Jscripts.PSIProgramRep.showHideManageUsers(executionContext);

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
}