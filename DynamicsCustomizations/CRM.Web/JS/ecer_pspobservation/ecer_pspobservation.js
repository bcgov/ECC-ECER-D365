if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.PSPObservation =
{
    onLoad: function (executionContext) {
        var formContext = executionContext.getFormContext();

        ECER.Jscripts.PSPObservation.showHideObservationFields(executionContext);
    },

    showHideObservationFields: function (executionContext) {
        var formContext = executionContext.getFormContext();

        var obType = formContext.getAttribute("ecer_observationtype").getValue();

        // Class Room Observation
        var instructorName = formContext.getControl("ecer_instructorname");
        var generalFeelSection = formContext.ui.tabs.get("tab_general").sections.get("tab_general_section_GeneralFeel");
        var classroomObservationSection = formContext.ui.tabs.get("tab_general").sections.get("tab_general_section_ClassroomObservation");
        var classRoomFields = [instructorName,generalFeelSection,classroomObservationSection];

        // Instructor Observation
        var facultyMember = formContext.getControl("ecer_facultymemberbeingobserved");
        var observer = formContext.getControl("ecer_observer");
        var course = formContext.getControl("ecer_course");
        var date = formContext.getControl("ecer_date");
        var instructorObservationSection = formContext.ui.tabs.get("tab_general").sections.get("tab_general_section_InstructorObservation");
        var instructroFields = [facultyMember, observer, course, date, instructorObservationSection];    

        if (obType == null) {
            classRoomFields.forEach(function myFunction(item) {
                ECER.Jscripts.PSPObservation.showHideCommon(item, false);
            });

            instructroFields.forEach(function myFunction(item) {
                ECER.Jscripts.PSPObservation.showHideCommon(item, false);
            });
        }
        // Classroom Observation
        else if (obType == 621870000) {
            classRoomFields.forEach(function myFunction(item) {
                ECER.Jscripts.PSPObservation.showHideCommon(item, true);
            });

            instructroFields.forEach(function myFunction(item) {
                ECER.Jscripts.PSPObservation.showHideCommon(item, false);
            });
        }
        // Instrcutor Observation
        else if (obType == 621870001) {
            classRoomFields.forEach(function myFunction(item) {
                ECER.Jscripts.PSPObservation.showHideCommon(item, false);
            });

            instructroFields.forEach(function myFunction(item) {
                ECER.Jscripts.PSPObservation.showHideCommon(item, true);
            });
        }
    },

    showHideCommon: function (controlName, indicator) {
        if (controlName != null) {
            controlName.setVisible(indicator);
        }
    }
}