if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.ReconsiderationInvestigation = {
    onLoad: function (executionContext) {
        var formContext = executionContext.getFormContext();

        // Call the function to show/hide fields based on the "type" field
        ECER.Jscripts.ReconsiderationInvestigation.showHideFields(executionContext);
    },

    // ECER-5487, ECER-5488
    // Because of similarities between the 2 tickets
    // Reconsideration Investigation Outcome and Reconsideration Immediate Action is merged to use ths same entity
    // But with Type of 
    // Investigation Outcome (621870000)
    // Immediate Action (621870001)
    // To show hide fields and sections by Type
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
        var isInvestigationOutcome = (typeFieldVal === 621870000);
        var isImmediateAction = (typeFieldVal === 621870001);
        var required = "none";
        if (isImmediateAction) {
            required = "required";
        }

        // Show and Required ecer_immediateactionid
        crm_Utility.showHide(executionContext, isImmediateAction, "ecer_immediateactionid");
        crm_Utility.setRequiredLevel(executionContext, required, "ecer_immediateactionid");

        // Show Hide Section containing QV based on Type
        crm_Utility.showHide(executionContext, isImmediateAction, "tab_general:section_immediateaction");
        crm_Utility.showHide(executionContext, isInvestigationOutcome, "tab_general:section_investigationoutcome");
    }
};