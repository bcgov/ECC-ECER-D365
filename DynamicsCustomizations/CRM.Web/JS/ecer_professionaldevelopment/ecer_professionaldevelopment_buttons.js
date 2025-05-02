if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.ProfessionalDevelopment = {

    onProfessionalDevelopmentSubgridApproveButton: function (formContext, selectedIds, selectedCount) {
        console.log("Selected Ids: " + selectedIds);
        console.log("Selected Ids: " + selectedCount);

        if (selectedIds === null || selectedIds?.length < 1)
            return;

        // Same conditions as in the flow
        let filter = "(Microsoft.Dynamics.CRM.In(PropertyName='ecer_professionaldevelopmentid',PropertyValues=[" + selectedIds.map(item => `'${item}'`).join(',') + "]) and statuscode ne 2 and statuscode ne 621870005 and statuscode ne 1 and statuscode ne 621870006 and ecer_totalanticipatedhours ge 0)";

        Xrm.WebApi.retrieveMultipleRecords("ecer_professionaldevelopment", "?$select=ecer_totalanticipatedhours,ecer_professionaldevelopmentid,_ecer_applicationid_value&$filter=" + filter).then(
            function success(results) {
                let totalApprovedHours = 0;
                let applicationId = results.entities.length > 0 ? results.entities[0]._ecer_applicationid_value : null;

                for (var i = 0; i < results.entities.length; i++) {

                    let update = {};
                    update.ecer_totalapprovedhours = results.entities[i].ecer_totalanticipatedhours;
                    update.statuscode = 2; // Approved
                    update.statecode = 1; // Inactive

                    totalApprovedHours += results.entities[i].ecer_totalanticipatedhours;

                    Xrm.WebApi.updateRecord("ecer_professionaldevelopment", results.entities[i].ecer_professionaldevelopmentid, update).then(function (result) {
                    });
                }

                let data = {};
                data.totalApprovedHours = totalApprovedHours;
                data.applicationId = applicationId;

                return data;
            }
        ).then(function (data) {

            if (data === null)
                return;

            let totalApprovedHours = data.totalApprovedHours;
            let applicationId = data.applicationId;

            if (applicationId === null)
                return;

            var currentApprovedHours = formContext.getAttribute("ecer_totalapprovedprofessionaldevelopmenthours")?.getValue() === null ? 0 : formContext.getAttribute("ecer_totalapprovedprofessionaldevelopmenthours")?.getValue();
            var approvedHours = currentApprovedHours + totalApprovedHours;

            formContext.getAttribute("ecer_totalapprovedprofessionaldevelopmenthours")?.setValue(approvedHours);

            formContext.data.refresh(true);
        });
    },
}