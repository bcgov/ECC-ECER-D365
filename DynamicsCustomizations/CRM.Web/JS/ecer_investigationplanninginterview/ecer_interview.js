if (typeof ECER === "undefined") { var ECER = {}; }
if (typeof ECER.Jscripts === "undefined") { ECER.Jscripts = {}; }

ECER.Jscripts.Interview = {
    onLoad: function (executionContext) {
        ECER.Jscripts.Interview.populateFromInvolvedPerson(executionContext);
    },
    onSave: function (executionContext) {
        this.onChangeDescription(executionContext);
    },
    onChangeDescription: function (executionContext) {
        // check if details is dirty
        let formContext = executionContext.getFormContext();

        let details = formContext.getAttribute("ecer_description");

        if (details === null
            || !details.getIsDirty()
            || !DOMParser) {
            return;
        }

        if (details.getValue() != null) {
            //ecer_detailstext is has string data from HTML in ecer_details
            var parsedString = (new DOMParser()).parseFromString(details.getValue(), 'text/html');

            formContext.getAttribute("ecer_descriptionplaintext")?.setValue(parsedString?.body?.textContent);
        }
        else {
            formContext.getAttribute("ecer_descriptionplaintext")?.setValue(null);
        }
    },
    populateFromInvolvedPerson: function (executionContext) {

        var lookupAttrName = "ecer_investigationplanninginvolve";
        var destNameAttr = "ecer_name";
        var destRoleAttr = "ecer_role";
        var destEmailAttr = "ecer_email";
        var destPhoneAttr = "ecer_phonenumber";


        var sourceTable = "ecer_investigationplanninginvolvedperson";

        var selectCols = "?$select=ecer_firstname,ecer_lastname,ecer_role,emailaddress,ecer_phonenumber";


        var formContext = executionContext.getFormContext();
        var lookupAttr = formContext.getAttribute(lookupAttrName);
        if (lookupAttr === null) { console.log("Lookup field not on form"); return; }

        var lookupValue = lookupAttr.getValue();
        if (lookupValue === null) { console.log("Lookup empty – nothing to copy"); return; }

        var lookupId = lookupValue[0].id.replace(/[{}]/g, "").toLowerCase();

        Xrm.WebApi.retrieveRecord(sourceTable, lookupId, selectCols).then(
            function success(record) {


                var current = formContext.getAttribute(lookupAttrName).getValue();
                if (!current || current[0].id.replace(/[{}]/g, "").toLowerCase() !== lookupId) { return; }

                var first = record.ecer_firstname || "";
                var last = record.ecer_lastname || "";
                var full = (first + " " + last).trim();


                if (full) formContext.getAttribute(destNameAttr).setValue(full);
                if (record.ecer_role !== undefined) formContext.getAttribute(destRoleAttr).setValue(record.ecer_role);
                if (record.emailaddress !== undefined) formContext.getAttribute(destEmailAttr).setValue(record.emailaddress);
                if (record.ecer_phonenumber !== undefined) formContext.getAttribute(destPhoneAttr).setValue(record.ecer_phonenumber);
            },
            function (error) {
                console.log("Interview populate error: " + error.message);
                Xrm.Utility.alertDialog("Couldn’t pull details from Involved Person.");
            }
        );
    }
};