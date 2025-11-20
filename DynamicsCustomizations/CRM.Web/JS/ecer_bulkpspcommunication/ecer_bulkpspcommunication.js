if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.BulkPSPCommunication =
{
    ReviewConfiguration_OnClick: function (formContext) {
        alert("Review Configuration button clicked.");
    },
    onLoad: function (executionContext) {
        this.statusReason_onChange(executionContext);
    },
    scheduledStartDate_OnChange: function (executionContext) {
        var schedDate = executionContext.getFormContext().getAttribute("ecer_scheduleddate")?.getValue();

        if (schedDate) {
            var currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0); // Set to midnight for accurate comparison
            schedDate.setHours(0, 0, 0, 0); // Set to midnight for accurate comparison
            if (schedDate < currentDate) {
                executionContext.getFormContext().getAttribute("ecer_scheduleddate").setValue(null);
                alert("Scheduled Start Date cannot be in the past. Please select a valid date.");
            }
        }
    },
    statusReason_onChange: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var statusReason = formContext.getAttribute("statuscode").getValue();
        formContext.ui.clearFormNotification("1");
        formContext.ui.clearFormNotification("2");

        var formtype = formContext.ui.getFormType();

        if (formtype === 1) //create form
        {
            return; //do nothing on create form
        }

        if (statusReason === 621870001) {
            formContext.ui.setFormNotification("Please note this scheduled communication is in Draft. Set to Active when ready.", "WARNING", "1");
        }
        else {
            formContext.ui.setFormNotification("Please note this scheduled communication is Active.", "WARNING", "2");
        }
    }
}