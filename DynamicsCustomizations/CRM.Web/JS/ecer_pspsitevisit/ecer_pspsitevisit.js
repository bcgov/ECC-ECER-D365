if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.PSPSiteVisit =
{
    onLoad: function (executionContext) {
        var formContext = executionContext.getFormContext();

        if (formContext.getAttribute("ecer_programrepresentativeid").getValue() == null) {
            ECER.Jscripts.PSPSiteVisit.setPSPRepresentative(executionContext);
        }
    },

    setPSPRepresentative: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var psp = formContext.getAttribute("ecer_programapplication").getValue();
        var pspRep = formContext.getAttribute("ecer_psiprogramrepresentative");

        if (psp == null) {
            pspRep.setValue(null);
            return;
        }

        var pspId = psp[0].id;
        var pspEntityType = psp[0].entityType;
        var columnSet = "_ecer_psiprogramrepresentative_value";

        Xrm.WebApi.retrieveRecord(pspEntityType, pspId, "?$select=" + columnSet).then(
            function success(result) {
                console.log(result);
                var pspRepId = result["_ecer_psiprogramrepresentative_value"]

                if (pspRepId == null) {
                    pspRep.setValue(null);
                    return;
                };
                var pspRepValue = [];
                pspRepValue[0] = {};
                pspRepValue[0].id = pspRepId;
                pspRepValue[0].name = result["_ecer_psiprogramrepresentative_value@OData.Community.Display.V1.FormattedValue"];
                pspRepValue[0].entityType = result["_ecer_psiprogramrepresentative_value@Microsoft.Dynamics.CRM.lookuplogicalname"];
                ECER.Jscripts.PSPSiteVisit.setLookupField(formContext, "ecer_psiprogramrepresentative", pspRepValue);
            },
            function (error) {
                console.log(error.message);
                pspRep.setValue(null);;
            }
        );

    },

    setLookupField: function (formContext, fieldName, fieldValue) {
        if (formContext != null
            && fieldName != null
            && fieldValue != null
            && fieldValue[0].id != null
            && fieldValue[0].name != null
            && fieldValue[0].entityType != null) {

            var field = formContext.getAttribute(fieldName);
            if (field != null) {
                field.setValue(fieldValue);
            }
        }
    },
}