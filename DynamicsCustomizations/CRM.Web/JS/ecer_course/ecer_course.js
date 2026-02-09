// Javascript source code

if (typeof ECER === "undefined") {
    var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {}
}

ECER.Jscripts.Course = {
    onload: function (executionContext) {
        this.programProfileHasChanges(executionContext);
    },
    programProfileHasChanges: function (executionContext) {
        var formContext = executionContext.getFormContext();

        // Check if course has program profile lookup value
        // if not null, fetch the program profile record and check if it has changes made field set to true
        // set new changes made field as visible or hidden based on the value

        let programProfileLookup = formContext.getAttribute("ecer_programid")?.getValue();

        if (programProfileLookup) {

            let programProfileId = programProfileLookup[0].id.replace("{", "").replace("}", "");
            Xrm.WebApi.retrieveRecord("ecer_program", programProfileId, "?$select=ecer_changesmade").then(
                function (result) {
                    let changesMade = result.ecer_changesmade === 621870000;

                    formContext.getControl("ecer_newcode")?.setVisible(changesMade);
                    formContext.getControl("ecer_newcoursename")?.setVisible(changesMade);
                    formContext.getControl("ecer_newcoursehourdecimal")?.setVisible(changesMade);
                },
                function (error) {
                    console.log(error.message);
                }
            );
        }
    },
    AddCourse: function (formContext, type) {
        var formParameters = {};

        switch (type) {
            // basic
            case "1":
                formParameters.ecer_programtype = 621870000;
                break;
            // ITE
            case "2":
                formParameters.ecer_programtype = 621870001;
                break;
            // SNE
            case "3":
                formParameters.ecer_programtype = 621870002;
                break;
        }

        // open form to create new course record
        var entityFormOptions = {};
        entityFormOptions["entityName"] = "ecer_course";
        entityFormOptions.openInNewWindow = true;

        formParameters.ecer_programid = formContext.data.entity.getId().replace("{", "").replace("}", "");
        formParameters.ecer_programidtype = "ecer_program";
        formParameters.ecer_programidname = formContext.getAttribute("ecer_name")?.getValue();

        let psiLookup = formContext.getAttribute("ecer_postsecondaryinstitution")?.getValue();

        if (!psiLookup || psiLookup.length > 0) {
            formParameters.ecer_postsecondaryinstitutionid = psiLookup[0].id.replace("{", "").replace("}", "");
            formParameters.ecer_postsecondaryinstitutionidtype = "ecer_postsecondaryinstitute";
            formParameters.ecer_postsecondaryinstitutionidname = psiLookup[0].name;
        }

        Xrm.Navigation.openForm(entityFormOptions, formParameters).then(
            function (success) {
                // refresh the subgrid after the form is closed
            },
            function (error) {
                console.log(error);
            }
        );
    }
}