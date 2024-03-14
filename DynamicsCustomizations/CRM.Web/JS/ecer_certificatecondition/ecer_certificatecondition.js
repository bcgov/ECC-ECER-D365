// Javascript source code

if (typeof ECER === "undefined") {
    var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {}
}

ECER.Jscripts.CertificateCondition = {
    onLoad: function (executionContext) {
    },


    populateOnPresetSelected: function (executionContext) {
        // ECER.Jscripts.CertificateCondition.populateOnPresetSelected
        var formContext = executionContext.getFormContext();
        var lookupAttributeName = "ecer_presetconditionid";
        var nameAttributeName = "ecer_name";
        var detailsAttributeName = "ecer_details";
        
        var lookupAttribute = formContext.getAttribute(lookupAttributeName);
        if (lookupAttribute != null) {
            var lookupValue = lookupAttribute.getValue();
            if (lookupValue != null) {
                var lookupId = lookupValue[0].id.toLowerCase().replace("{", "").replace("}", "");
                Xrm.WebApi.retrieveRecord("ecer_certificateconditionspreset", lookupId).then(
                    function success(record) {
                        var name = record.ecer_name;
                        var details = record.ecer_details;
                        formContext.getAttribute(nameAttributeName).setValue(name);
                        formContext.getAttribute(detailsAttributeName).setValue(details);
                    }
                );
            }
        }
    }
}


