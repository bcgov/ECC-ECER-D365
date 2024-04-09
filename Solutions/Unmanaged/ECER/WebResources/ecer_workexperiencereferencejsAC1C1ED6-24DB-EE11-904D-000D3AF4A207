// Javascript source code

if (typeof ECER === "undefined") {
    var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {}
}

ECER.Jscripts.WorkExperienceReference = {
    onLoad: function (executionContext) {
        ECER.Jscripts.WorkExperienceReference.showHideOnProvinceSelected(executionContext);
    },


    showHideOnProvinceSelected: function (executionContext) {
        // ECER-1161
        // Lookup for Province.  If selected Other, then show the text field and make that required.
        // Other Province GUID
        var otherProvinceGUID = "5e291527-7ada-ee11-904c-002248d56374";
        var formContext = executionContext.getFormContext();
        var lookupAttributeName = "ecer_referenceececertifiedprovinceid";
        var textAttributeName = "ecer_referenceececertifiedprovince";
        var lookupAttribute = formContext.getAttribute(lookupAttributeName);
        var show = false;
        var required = "none";
        if (lookupAttribute != null && lookupAttribute.getValue() != null) {
            var lookupValue = lookupAttribute.getValue()[0].id.toLowerCase().replace("{", "").replace("}", "");
            if (lookupValue == otherProvinceGUID) {
                required = "required";
                show = true;
            }
        }

        crm_Utility.showHide(executionContext, show, textAttributeName);
        crm_Utility.setRequiredLevel(executionContext, required, textAttributeName);
    }
}


