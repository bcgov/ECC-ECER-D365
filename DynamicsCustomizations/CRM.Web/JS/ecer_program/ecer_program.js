if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}


ECER.Jscripts.Program =
{
    onLoad: function (executionContext) {
        var formContext = executionContext.getFormContext();

        ECER.Jscripts.Program.courseSectionShowHide(executionContext);
    },

    courseSectionShowHide: function (executionContext) {
        var formContext = executionContext.getFormContext();

        var programType = formContext.getAttribute("ecer_programtype");
        if (programType == null) {
            return;
        }

        var programTypeVal;
        programTypeVal = programType.getValue();
        var courseTab = formContext.ui.tabs.get("tab_courses");

        if (programTypeVal == null) {
            courseTab.sections.get("section_course_basic").setVisible(false);
            courseTab.sections.get("section_course_sne").setVisible(false);
            courseTab.sections.get("section_course_ite").setVisible(false);

            return;
        }
        
        // Basic
        if (Object.values(programTypeVal).indexOf(621870000) > -1) {
            courseTab.sections.get("section_course_basic").setVisible(true);
        }
        else {
            courseTab.sections.get("section_course_basic").setVisible(false);
        }

        // SNE
        if (Object.values(programTypeVal).indexOf(621870002) > -1) {
            courseTab.sections.get("section_course_sne").setVisible(true);
        }
        else {
            courseTab.sections.get("section_course_sne").setVisible(false);
        }

        // ITE
        if (Object.values(programTypeVal).indexOf(621870001) > -1) {
            courseTab.sections.get("section_course_ite").setVisible(true);
        }
        else {
            courseTab.sections.get("section_course_ite").setVisible(false);
        }
    }
}