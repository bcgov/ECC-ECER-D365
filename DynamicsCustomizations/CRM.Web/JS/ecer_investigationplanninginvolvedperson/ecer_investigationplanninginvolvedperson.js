// JavaScript source code

if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.InvolvedPerson = {

    onChangeContact: function (executionContext) {
        let formContext = executionContext.getFormContext();

        let contact = formContext.getAttribute("ecer_contact");

        let mapping = [
            { "involvedPersonAttribute": "ecer_firstname", "contactAttribute": "firstname" },
            { "involvedPersonAttribute": "ecer_lastname", "contactAttribute": "lastname" },
            { "involvedPersonAttribute": "ecer_dateofbirthtext", "contactAttribute": "birthdate", format: "MMMM dd yyyy" },
            { "involvedPersonAttribute": "ecer_phonenumber", "contactAttribute": "telephone1" },
            { "involvedPersonAttribute": "emailaddress", "contactAttribute": "emailaddress1" },
        ];

        if (contact != null && contact.getValue() != null) {

            let contactId = contact.getValue()[0].id;

            Xrm.WebApi.retrieveRecord("contact", contactId, "?$select=firstname,lastname,birthdate,emailaddress1,telephone1").then(
                function (result) {

                    mapping.forEach(function (map) {

                        let contactAttribute = map.contactAttribute;
                        let involvedPersonAttribute = map.involvedPersonAttribute;

                        if (result.hasOwnProperty(contactAttribute)) {
                            let val = result[contactAttribute];
                            if (map.format && val != null) {
                                let dt = new Date(val);
                                val = dt.format(map.format);
                            }

                            localSetValue(involvedPersonAttribute, val);
                        }
                        else {
                            localSetValue(involvedPersonAttribute, null);
                        }
                    });
                },
                function (error) {
                    console.log(error.message);
                });
        }
        else {
            mapping.forEach(function (map) {
                localSetValue(map.involvedPersonAttribute, null);
            });
        }

        function localSetValue(attribute, value) {
            formContext.getAttribute(attribute)?.setValue(value);
        }
    },
}