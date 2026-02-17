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
        this.populateInstruction(executionContext);
    },
    populateInstruction: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var formType = formContext.ui.getFormType();
        var isRecordActive = (formType == 1) || (formType == 2);
        var attributeName = "ecer_instruction";
        var defaultContent =
            "Tags supported in 'Message' \n" +
            "{{LastBusinessDateOfAugust}} - Last Friday of August in the year of job execution(current year). Has a format of Day, Month Date, Year \n" +
            "{{PSIName}} - Education Institute Name \n" +
            "{{CallculatedAcademicYear}} - Represents last 2 digits of next year. Example if current year is 2025, this value is 26. Useful for formatting text like : 2025/26 \n" +
            "{{CalculatedCurrentYear}} - Represents current year in the format of YYYY.";
        var attribute = formContext.getAttribute(attributeName);
        if (attribute != null && attribute.getValue() == null && isRecordActive) {
            attribute.setValue(defaultContent);
        }
        var attributeCtrl = formContext.getControl(attributeName);
        if (attributeCtrl != null) {
            attributeCtrl.setDisabled(true); // disable at all times
        }
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