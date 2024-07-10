// Javascript source code

if (typeof ECER === "undefined") {
    var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {}
}

ECER.Jscripts.ApplicationAssessments = {
    onLoad: function (executionContext) {
        // Disable Editable Grid Columns
    },

    disableEducationAssessmentGridColumns: function (executionContext) {
        //Some columns should not be editable
        if (!executionContext) {
            console.error("Execution context is not defined.");
            return;
        }

        var formContext = executionContext.getFormContext();

        var stateCodeAttribute = formContext.getAttribute("statecode");
        if (stateCodeAttribute && stateCodeAttribute.getValue() === 1) {
            return;
        }

        formContext.getData().getEntity().attributes.forEach(function (attr) {
            attr.controls.forEach(function (control) {
                control.setDisabled(true);
            });
        });

        var userSettings = Xrm.Utility.getGlobalContext().userSettings;
        var currentUserId = userSettings.userId;

        var createdBy = formContext.getAttribute("createdby").getValue();
        var createdById = createdBy ? createdBy[0].id : "";

        var ownerUser = formContext.getAttribute("ownerid").getValue();
        var ownerUserId = ownerUser ? ownerUser[0].id : "";

        var createdOn = formContext.getAttribute("createdon").getValue();
        var createdOnDate = createdOn ? createdOn.toDateString() : "";

        var today = new Date().toDateString();

        if ((currentUserId === createdById || currentUserId === ownerUserId) && createdOnDate === today) {
            formContext.getData().getEntity().attributes.forEach(function (attr) {
                var attrName = attr.getName();
                if (attrName === "ecer_notes" || attrName === "ecer_decision") {
                    attr.controls.forEach(function (control) {
                        control.setDisabled(false);
                    });
                }
            });
        }
    }
}


