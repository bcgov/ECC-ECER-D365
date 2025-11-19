if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.ProfessionalDevelopment = {
    onLoad: function (executionContext) {
        ECER.Jscripts.ProfessionalDevelopment.validateStartEndDate(executionContext);
    },

    validateStartEndDate: function (executionContext) {
        var formContext = executionContext.getFormContext();

        var startAttr = formContext.getAttribute("ecer_startdate");
        var endAttr = formContext.getAttribute("ecer_enddate");

        if (!startAttr || !endAttr) {
            return;
        }

        var startDate = startAttr.getValue();
        var endDate = endAttr.getValue();

        var startCtrl = formContext.getControl("ecer_startdate");
        var endCtrl = formContext.getControl("ecer_enddate");
        var notificationKey = "start_end_date_range";

        // Clear previous warnings
        if (startCtrl) {
            startCtrl.clearNotification(notificationKey);
        }
        if (endCtrl) {
            endCtrl.clearNotification(notificationKey);
        }

        // Normalize "today" to date-only
        var now = new Date();
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Created On (for 5-year window) – only available after record is created
        var createdOnAttr = formContext.getAttribute("createdon");
        var createdOn = createdOnAttr ? createdOnAttr.getValue() : null;
        var fiveYearsAgo = null;
        if (createdOn) {
            fiveYearsAgo = new Date(
                createdOn.getFullYear() - 5,
                createdOn.getMonth(),
                createdOn.getDate()
            );
        }

        // Helper to block save if needed
        var args = executionContext.getEventArgs && executionContext.getEventArgs();
        function preventSave() {
            if (args && args.preventDefault) {
                args.preventDefault();
            }
        }

        if (startDate && startDate > today && startCtrl) {
            startCtrl.setNotification(
                "Start Date cannot be later than today.",
                notificationKey
            );
            preventSave();
        }

        if (endDate && endDate > today && endCtrl) {
            endCtrl.setNotification(
                "End Date cannot be later than today.",
                notificationKey
            );
            preventSave();
        }

        if (startDate && endDate && endDate < startDate && endCtrl) {
            endCtrl.setNotification(
                "End Date cannot be earlier than Start Date.",
                notificationKey
            );
            preventSave();
        }

        if (fiveYearsAgo) {
            if (startDate && startDate < fiveYearsAgo && startCtrl) {
                startCtrl.setNotification(
                    "Start Date must be within 5 years of the Created On date.",
                    notificationKey
                );
                preventSave();
            }

            if (endDate && endDate < fiveYearsAgo && endCtrl) {
                endCtrl.setNotification(
                    "End Date must be within 5 years of the Created On date.",
                    notificationKey
                );
                preventSave();
            }
        }
    }
};
