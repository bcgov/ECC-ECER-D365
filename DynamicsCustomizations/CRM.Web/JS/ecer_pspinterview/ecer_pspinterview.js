if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}


ECER.Jscripts.PSPInterview =
{
    onLoad: function (executionContext) {
        var formContext = executionContext.getFormContext();

        ECER.Jscripts.PSPInterview.lockIntervieweeType(executionContext);
    },

    lockIntervieweeType: function (executionContext) {
        var formContext = executionContext.getFormContext();

        var formTypeVal = formContext.ui.getFormType();
        var intervieweeType = formContext.getControl("ecer_intervieweetype");

        if (formTypeVal == 1) {
            intervieweeType.setDisabled(false);
        }
    }
}