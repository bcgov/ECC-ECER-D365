if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.Application =
{

    crm_ExecutionContext: null,
    OnLoad: function (executionContext) {
        this.crm_ExecutionContext = executionContext;
        // var formContext = executionContext.getFormContext();
        // var formType = formContext.ui.getFormType();
        ECER.Jscripts.Application.disableSystemPopulateFields(executionContext);
    },

    disableSystemPopulateFields: function (executionContext) {
        crm_Utility.enableDisable(executionContext, true, "ecer_characterreferencereceiveddate");
        crm_Utility.enableDisable(executionContext, true, "ecer_workexperiencereceiveddate");
        crm_Utility.enableDisable(executionContext, true, "ecer_transcriptreceiveddate");
        crm_Utility.enableDisable(executionContext, true, "ecer_parentalreferencereceiveddate");
        crm_Utility.enableDisable(executionContext, true, "ecer_readyforassessmentdate");
    },

    setDateOnToggle: function (executionContext, toggleFieldName, dateFieldName) {
        // ECER.Jscripts.Application.setDateOnToggle(executionContext, "ecer_characterreferencereceived", "ecer_characterreferencereceiveddate");
        var formContext = executionContext.getFormContext();
        var dateAttribute = formContext.getAttribute(dateFieldName);
        var isTrue = false;
        if (formContext.getAttribute(toggleFieldName) && formContext.getAttribute(toggleFieldName).getValue() != null) {
            isTrue = formContext.getAttribute(toggleFieldName).getValue();
        }
        if (isTrue) {
            var now = new Date();
            var dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateAttribute.setValue(dateOnly);
        }
        else {
            dateAttribute.setValue(null);
        }
    }
}
 