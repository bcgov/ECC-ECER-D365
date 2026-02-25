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
        this.setDefaultsOnCreate(executionContext);
    },
    setDefaultsOnCreate: function (executionContext) {
        var formContext = executionContext.getFormContext();

        let programProfile = formContext.getAttribute("ecer_programprofileid").getValue();
        let programApplication = formContext.getAttribute("ecer_programapplicationid").getValue();
        let campus = formContext.getAttribute("ecer_campusid").getValue();

        let educationalInstitution = formContext.getAttribute("ecer_educationalinstitutionid");

        if (educationalInstitution.getValue() != null)
            return; // if educational institution already has a value, do not override it

        if (programProfile !== null) {
            Xrm.WebApi.retrieveRecord("ecer_program", programProfile[0].id, "?$select=_ecer_postsecondaryinstitution_value").then(
                function success(result) {
                    let educationalInstitution = result._ecer_postsecondaryinstitution_value;
                    if (educationalInstitution !== null) {
                        educationalInstitution.setValue([
                            {
                                id: educationalInstitution,
                                name: result["_ecer_postsecondaryinstitution_value@OData.Community.Display.V1.FormattedValue"],
                                entityType: "ecer_postsecondaryinstitute"
                            }
                        ]);

                        educationalInstitution.setSubmitMode("dirty");
                    }
                },
                function (error) {
                    console.log(error.message);
                }
            );
        }
        else if (programApplication !== null) {
            Xrm.WebApi.retrieveRecord("ecer_postsecondaryinstituteprogramapplicaiton", programApplication[0].id, "?$select=_ecer_postsecondaryinstitute_value").then(
                function success(result) {
                    let educationalInstitution = result._ecer_postsecondaryinstitute_value;
                    if (educationalInstitution !== null) {
                        educationalInstitution.setValue([
                            {
                                id: educationalInstitution,
                                name: result["_ecer_postsecondaryinstitute_value@OData.Community.Display.V1.FormattedValue"],
                                entityType: "ecer_postsecondaryinstitute"
                            }
                        ]);

                        educationalInstitution.setSubmitMode("dirty");
                    }
                },
                function (error) {
                    console.log(error.message);
                }
            );
        }
        else if (campus !== null) {
            Xrm.WebApi.retrieveRecord("ecer_postsecondaryinstitutecampus", campus[0].id, "?$select=_ecer_postsecondaryinstitute_value").then(
                function success(result) {
                    let educationalInstitution = result._ecer_postsecondaryinstitute_value;
                    if (educationalInstitution !== null) {
                        formContext.getAttribute("ecer_educationalinstitutionid").setValue([
                            {
                                id: educationalInstitution,
                                name: result["_ecer_postsecondaryinstitute_value@OData.Community.Display.V1.FormattedValue"],
                                entityType: "ecer_postsecondaryinstitute"
                            }]);

                        educationalInstitution.setSubmitMode("dirty");
                    }
                });
        }
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