// Javascript source code

if (typeof ECER === "undefined") {
    var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {}
}

ECER.Jscripts.Course = {
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