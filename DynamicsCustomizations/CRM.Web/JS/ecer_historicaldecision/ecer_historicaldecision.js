if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.HistoricalDecision = {
    onLoad: function (executionContext) {
        var formContext = executionContext.getFormContext();

        // Call the function to show/hide fields based on the "type" field
        ECER.Jscripts.HistoricalDecision.showHideFields(executionContext);
    },

    // ECER-4337
    showHideFields: function (executionContext) {
        var formContext = executionContext.getFormContext();

        var typeField = formContext.getAttribute("ecer_type");
        if (typeField == null) {
            return;
        }

        var typeFieldVal = typeField.getValue();  // This will give you the integer value of the choice field

        // If typeFieldVal is null, do nothing
        if (typeFieldVal == null) {
            return;
        }

        // Check if the value of the choice field is the one for "ECE Assistant"
        var isECEAssistant = (typeFieldVal === 621870000);

        formContext.getControl("ecer_applicationid").setVisible(!isECEAssistant);
        //ECER-5035 : text field removed from the form : formContext.getControl("ecer_nameofcredential").setVisible(!isECEAssistant);
        formContext.getControl("ecer_programname").setVisible(!isECEAssistant);
        formContext.getControl("ecer_decisiondate").setVisible(!isECEAssistant);

        // Show Hide Subgrid Views based on Type
        crm_Utility.showHide(executionContext, isECEAssistant, "tab_general:section_eceassistanthistory");
        crm_Utility.showHide(executionContext, !isECEAssistant, "tab_general:section_ecebasichistory");

    }
};