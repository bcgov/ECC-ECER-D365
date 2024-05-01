if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}


ECER.Jscripts.ParallelProcessCommunication =
{
    btnReply: function (PrimaryControl) {
        Xrm.Utility.showProgressIndicator("In Progress");

        setTimeout(function () {
            var applicationId = PrimaryControl.getAttribute("ecer_applicationid").getValue()[0].id.replace("{", "").replace("}", "");
            var applicationName = PrimaryControl.getAttribute("ecer_applicationid").getValue()[0].name;
            var investigationId = PrimaryControl.getAttribute("ecer_investigationid").getValue()[0].id.replace("{", "").replace("}", "");
            var investigationName = PrimaryControl.getAttribute("ecer_investigationid").getValue()[0].name;
            var recordId = PrimaryControl.data.entity.getId().replace("{", "").replace("}", "");
            var recordSubject = PrimaryControl.getAttribute("ecer_subject").getValue();

            var entityFormOptions = {};
            entityFormOptions["entityName"] = "ecer_parallelprocesscommunication";

            // Set default values for the Parallel Process Communication form
            var formParameters = {};
            // Application
            formParameters["ecer_applicationid"] = applicationId;
            formParameters["ecer_applicationidname"] = applicationName;
            // Investigation
            formParameters["ecer_investigationid"] = investigationId;
            formParameters["ecer_investigationidname"] = investigationName;
            // Parent Communication
            formParameters["ecer_ppcommunicationid"] = recordId;
            formParameters["ecer_ppcommunicationidname"] = recordSubject;


            // Open the form.
            Xrm.Navigation.openForm(entityFormOptions, formParameters).then(
                function (success) {
                    console.log(success);
                },
                function (error) {
                    console.log(error);
                });

            Xrm.Utility.closeProgressIndicator();
        }, 1000);
    },
}