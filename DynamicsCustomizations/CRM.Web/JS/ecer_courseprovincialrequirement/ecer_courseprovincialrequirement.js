// Javascript source code

if (typeof ECER === "undefined") {
    var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {}
}

ECER.Jscripts.CourseProvincialRequirement = {
    crm_ExecutionContext: null,
    onLoad: function (executionContext) {
        this.crm_ExecutionContext = executionContext;
        ECER.Jscripts.CourseProvincialRequirement.showHideProgramAreas(executionContext);
    },
    showHideProgramAreas: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var basicProgramAreaAttributeName = "ecer_programareaid";
        var iteProgramAreaAttributeName = "ecer_programareaid1";
        var sneProgramAreaAttributeName = "ecer_programareaid2";

        // Hide all 3 to start with
        crm_Utility.showHide(executionContext, false, basicProgramAreaAttributeName);
        crm_Utility.showHide(executionContext, false, iteProgramAreaAttributeName);
        crm_Utility.showHide(executionContext, false, sneProgramAreaAttributeName);

        // Check the Lookup Filter Source first
        var courseAttributeName = "ecer_courseid";
        var courseAttribute = formContext.getAttribute(courseAttributeName);
        var courseValue = courseAttribute.getValue();
        if (courseValue == null) {
            // If course does not contain data, do nothing
            return;
        }

        var courseId = courseValue[0].id;
        var course = crm_Utility.retrieveRecordCustom(courseId, courseValue[0].entityType);
        if (course == null) {
            // If course is not found for some reason.... do nothing
            return;
        }

        // 621870000 Basic
        // 621870001 ITE
        // 621870002 SNE
        var programTypeValue = course.ecer_programtype;
        var attributeToShow = "";
        switch (programTypeValue) {
            case 621870000:
                attributeToShow = basicProgramAreaAttributeName;
                break;
            case 621870001:
                attributeToShow = iteProgramAreaAttributeName;
                break;
            case 621870002:
                attributeToShow = sneProgramAreaAttributeName;
                break;
        }
        crm_Utility.showHide(executionContext, true, attributeToShow);
    },
}