if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.ProvincialRequirement = {
    onLoad: function (executionContext) {
        var formContext = executionContext.getFormContext();

        ECER.Jscripts.ProvincialRequirement.levelOfRequirmentCertifiedLevels(executionContext);
    },

    // ECER-4150
    levelOfRequirmentCertifiedLevels: function (executionContext) {
        var formContext = executionContext.getFormContext();

        var certificateLevelField = formContext.getAttribute("ecer_certificatelevels");
        var inProgressField = formContext.getAttribute("ecer_programdevelopmentinprogress");
        if (certificateLevelField == null || inProgressField == null) {
            return;
        }

        var inProgressFieldValue = inProgressField.getValue();

        // If In Progress, then certified Level field is not required
        // It is a multi-selection choice field.  Only form script can change behavior
        var levelOfRequirement = "required";
        if (inProgressFieldValue == true) {
            levelOfRequirement = "none";
        }

        certificateLevelField.setRequiredLevel(levelOfRequirement);

    }
};