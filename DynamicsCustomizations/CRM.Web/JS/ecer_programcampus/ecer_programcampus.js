if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}


ECER.Jscripts.ProgramCampus =
{
    onLoad: function (executionContext) {
        var formContext = executionContext.getFormContext();

        this.mandatoryBasedOnCampus(executionContext);
    },
    mandatoryBasedOnCampus: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var campusField = formContext.getAttribute("ecer_campusid");

        if (campusField != null && campusField.getValue() !== null) {

            Xrm.WebApi.retrieveRecord("ecer_postsecondaryinstitutecampus", campusField.getValue()[0].id, "?$select=ecer_satelliteortemporarylocation").then(
                function (result) {
                    if (result.ecer_satelliteortemporarylocation === 621870000) {
                        // make start and end date mandatory
                        formContext.getAttribute("ecer_startdate").setRequiredLevel("required");
                        formContext.getAttribute("ecer_enddate").setRequiredLevel("required");
                    }
                },
                function (error) {

                });

        }
        else {
            // make start and end date not mandatory
            formContext.getAttribute("ecer_startdate").setRequiredLevel("none");
            formContext.getAttribute("ecer_enddate").setRequiredLevel("none");
        }
    }
}