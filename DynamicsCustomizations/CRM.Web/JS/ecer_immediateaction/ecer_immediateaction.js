if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.ImmediateAction = {
    onLoad: function (executionContext) {
        var formContext = executionContext.getFormContext();

        // Call the function to show/hide fields based on the "type" field
        ECER.Jscripts.ImmediateAction.showHideReconsiderationFields(executionContext);
    },

    // ECER-5488
    showHideReconsiderationFields: function (executionContext) {
        var formContext = executionContext.getFormContext();

        var reconsiderationRequestField = formContext.getAttribute("ecer_reconsiderationrequest");
        if (reconsiderationRequestField == null) {
            return;
        }

        var fieldValue = reconsiderationRequestField.getValue();  // expecting a 2-option

        // If reconsiderationRequestField is null, do nothing
        // the field is a boolean.  will only be NULL for new record prior to the field exist
        if (fieldValue == null) {
            fieldValue = false;
        }

        // Show Hide Tab tab_reconsideration
        crm_Utility.showHide(executionContext, fieldValue, "tab_reconsideration");
    }
};