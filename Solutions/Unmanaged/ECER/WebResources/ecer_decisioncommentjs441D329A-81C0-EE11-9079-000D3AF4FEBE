// Javascript source code

if (typeof ECER === "undefined") {
    var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {}
}

ECER.Jscripts.Decision_Comment = {
    onLoad: function (executionContext) {
        ECER.Jscripts.Decision_Comment.disableFormCreatedByAndCreatedOn(executionContext);
    },


    disableFormCreatedByAndCreatedOn: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var formType = formContext.ui.getFormType();
        if (formType !== 2) {
            return;
        }

        var attributes = formContext.data.entity.attributes.get();

        attributes.forEach(function (attribute) {
            var attributeName = attribute.getName();
            var control = formContext.getControl(attributeName);
            if (control) {
                control.setDisabled(true);
            }
        });

        var userSettings = Xrm.Utility.getGlobalContext().userSettings
        var currentUserId = userSettings.userId

        var createdBy = formContext.getAttribute("createdby").getValue();
        var createdById = createdBy ? createdBy[0].id : "";

        var createdOn = formContext.getAttribute("createdon").getValue();
        var createdOnDate = createdOn ? createdOn.toDateString() : "";

        var today = new Date().toDateString();

        if (currentUserId === createdById && createdOnDate === today) {
            var notesControl = formContext.getControl("ecer_notes");
            if (notesControl !== null) {
                notesControl.setDisabled(false);
            }
        }
    },
    disableGridRowCreatedByAndCreatedOn: function (executionContext) {
        //verify if current user is same and current date is same day otherwise make row read only. Ignore if row is already inactive.
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

        var userSettings = Xrm.Utility.getGlobalContext().userSettings
        var currentUserId = userSettings.userId

        var createdBy = formContext.getAttribute("createdby").getValue();
        var createdById = createdBy ? createdBy[0].id : "";

        var createdOn = formContext.getAttribute("createdon").getValue();
        var createdOnDate = createdOn ? createdOn.toDateString() : "";

        var today = new Date().toDateString();

        if (currentUserId === createdById && createdOnDate === today) {
            formContext.getData().getEntity().attributes.forEach(function (attr) {
                var attrName = attr.getName();
                if (attrName === "ecer_notes") {
                    attr.controls.forEach(function (control) {
                        control.setDisabled(false);
                    });
                }
            });
        }
    }
}


