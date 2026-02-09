// Javascript source code

if (typeof ECER === "undefined") {
    var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {}
}

ECER.Jscripts.ProgramApplicationComponentGroup = {
    crm_ExecutionContext: null,
    onLoad: function (executionContext) {
        this.crm_ExecutionContext = executionContext;
        ECER.Jscripts.ProgramApplicationComponentGroup.showHideComponentGroup(executionContext);
    },
    showHideComponentGroup: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var unfilterAttributeName = "ecer_componentgroup";
        var programIntentAttributeName = "ecer_componentgroup1";
        var administrationAttributeName = "ecer_componentgroup2";
        var programInstructionAttributeName = "ecer_componentgroup3";
        var practicumAttributeName = "ecer_componentgroup4";
        var curriculumDesignAttributeName = "ecer_componentgroup5";

        // Hide all 5 filtered ones to start with
        crm_Utility.showHide(executionContext, true, unfilterAttributeName);
        crm_Utility.showHide(executionContext, false, programIntentAttributeName);
        crm_Utility.showHide(executionContext, false, administrationAttributeName);
        crm_Utility.showHide(executionContext, false, programInstructionAttributeName);
        crm_Utility.showHide(executionContext, false, practicumAttributeName);
        crm_Utility.showHide(executionContext, false, curriculumDesignAttributeName);

        // Check the Lookup Filter Source first
        var categoryAttributeName = "ecer_category";
        var categoryAttribute = formContext.getAttribute(categoryAttributeName);
        var categoryValue = categoryAttribute.getValue();
        if (categoryValue == null) {
            // If course does not contain data, do nothing
            return;
        }

        // IF category contains data, then hide the unfilter one
        crm_Utility.showHide(executionContext, false, unfilterAttributeName);

        // 621870000 Program Intent
        // 621870001 Administration
        // 621870002 Program Instruction
        // 621870003 Practicum
        // 621870004 Curriculum Design
        var attributeToShow = "";
        switch (categoryValue) {
            case 621870000:
                attributeToShow = programIntentAttributeName;
                break;
            case 621870001:
                attributeToShow = administrationAttributeName;
                break;
            case 621870002:
                attributeToShow = programInstructionAttributeName;
                break;
            case 621870003:
                attributeToShow = practicumAttributeName;
                break;
            case 621870004:
                attributeToShow = curriculumDesignAttributeName;
                break;
        }
        crm_Utility.showHide(executionContext, true, attributeToShow);
    },
}