if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.REMChecklistTemplate = {
    crm_ExecutionContext: null,
    crm_FormContext: null,

    onLoad: function (executionContext) {
        this.crm_ExecutionContext = executionContext;
        this.crm_FormContext = executionContext.getFormContext();

        ECER.Jscripts.REMChecklistTemplate.filterPspSiteVisitType(executionContext);
    },

    filterPspSiteVisitType: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var fieldName = "ecer_pspsitevisittype";

        var control = formContext.getControl(fieldName);
        if (!control) {
            return;
        }

        // Allowed option values
        var allowedValues = [
            621870009,
            621870010
        ];

        // Get all existing options
        var options = control.getOptions();

        options.forEach(function (option) {
            if (allowedValues.indexOf(option.value) === -1) {
                control.removeOption(option.value);
            }
        });
    }
};