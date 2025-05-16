// JavaScript source code

if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.Allegation = {
    onSave: function (executionContext) {
        this.onChangeDetails(executionContext);
    },
    onChangeDetails: function (executionContext) {
        // check if details is dirty
        let formContext = executionContext.getFormContext();

        let details = formContext.getAttribute("ecer_details");

        if (details === null
            || !details.getIsDirty()
            || !DOMParser) {
            return;
        }

        if (details.getValue() != null) {
            //ecer_detailstext is has string data from HTML in ecer_details
            var parsedString = (new DOMParser()).parseFromString(details.getValue(), 'text/html');

            formContext.getAttribute("ecer_detailstext")?.setValue(parsedString?.body?.textContent);
        }
        else {
            formContext.getAttribute("ecer_detailstext")?.setValue(null);
        }
        formContext.data.save();
    }
}