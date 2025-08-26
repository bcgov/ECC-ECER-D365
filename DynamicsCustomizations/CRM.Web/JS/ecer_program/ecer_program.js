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
        ECER.Jscripts.Program.filterHeaderStatusReason(executionContext);
        ECER.Jscripts.Program.restrictStatusReasonAccess(executionContext);
    },

    filterHeaderStatusReason: function (executionContext) {
        // ECER-5107
        crm_Utility.filterOutOptionSet(executionContext, "header_statuscode", "621870003"); // Remove Denied        
        crm_Utility.filterOutOptionSet(executionContext, "statuscode", "621870003");
    },

    restrictStatusReasonAccess: function (executionContext) {
        // ECER-2963
        var programDirectorRole = crm_Utility.checkCurrentUserRole("PSP - Program Director");
        var programAnalystRole = crm_Utility.checkCurrentUserRole("PSP - Program Analyst");
        var programCooridnatorRole = crm_Utility.checkCurrentUserRole("PSP - Program Coordinator");
        var sysAdminRole = crm_Utility.checkCurrentUserRole("System Administrator");
        var isDisable = !(programDirectorRole || programAnalystRole || programCooridnatorRole || sysAdminRole);
        crm_Utility.enableDisable(executionContext, isDisable, "header_statuscode");
        crm_Utility.enableDisable(executionContext, isDisable, "statuscode");
    },
    
    courseSectionShowHide: function (executionContext) {
        var formContext = executionContext.getFormContext();

        var programType = formContext.getAttribute("ecer_programtypes");
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