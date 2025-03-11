// JavaScript source code

if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.Contact = {
    crm_ExecutionContext: null,
    selected_contacts: [],
    onLoad: function (executionContext) {
        this.crm_ExecutionContext = executionContext;
        ECER.Jscripts.Contact.showTabsIfBCECE(executionContext);
        ECER.Jscripts.Contact.evaluateAge(executionContext);
    },

    showTabsIfBCECE: function (executionContext) {
        try {
            var formContext = executionContext.getFormContext();
            var show = false;
            var applicationTab = formContext.ui.tabs.get("tab_applications");
            var educationTab = formContext.ui.tabs.get("tab_education");
            var workExpTab = formContext.ui.tabs.get("tab_workexperience");
            var characterRefTab = formContext.ui.tabs.get("tab_characterreferences");
            var professionalDevTab = formContext.ui.tabs.get("tab_professionaldevelopment");
            if (formContext.getAttribute("ecer_isbcece") && formContext.getAttribute("ecer_isbcece").getValue() != null) {
                show = formContext.getAttribute("ecer_isbcece").getValue();
            }
            // Always Show - ECER-4002
            show = true;
            applicationTab.setVisible(show);
            educationTab.setVisible(show);
            workExpTab.setVisible(show);
            characterRefTab.setVisible(show);
            professionalDevTab.setVisible(show);
        }
        catch (err) {
            ECER.Jscripts.Contact.showMessage(err);
        }

    },

    evaluateAge: function (executionContext) {
        try {
            var formContext = executionContext.getFormContext();
            var isUnder19 = false;
            var birthDateAttribute = formContext.getAttribute("birthdate");
            if (birthDateAttribute != null && birthDateAttribute.getValue() != null) {
                var birthDate = birthDateAttribute.getValue();
                var today = new Date();
                var diff = (today.getTime() - birthDate.getTime()) / 1000;
                diff /= (60 * 60 * 24);
                var differenceInYears = Math.abs((diff / 365.25));
                if (differenceInYears < 19) {
                    isUnder19 = true;
                }
            }
            var isUnder19Attribute = formContext.getAttribute("ecer_isunder19");
            // Is Under 19 is a Choice with YES/NO option
            // YES = 621870000
            // NO = 621870001
            if (isUnder19Attribute != null) {
                var isUnder19Value = isUnder19Attribute.getValue();
                // Set value if the value is different
                if (isUnder19Value != 621870000 && isUnder19) {
                    // IF Is Under 19 is NOT YES and Evaluated Age is Under 19
                    isUnder19Attribute.setValue(621870000);
                    formContext.data.save();
                }
                else if (isUnder19Value != 621870001 && !isUnder19) {
                    // IF Is Under 19 is NOT NO and Evaluated Age is NOT Under 19
                    isUnder19Attribute.setValue(621870001);
                    formContext.data.save();
                }
            }
        }
        catch (err) {
            ECER.Jscripts.Contact.showMessage(err);
        }
    },

    showMessage: function (message) {
        /// <summary>
        /// This function is used to show Message
        /// </summary>
        /// <param name="message" type="string">
        /// Message that needs to be shown
        /// </param>
        /// <returns type="void" />
        var functionName = "showMessage";
        //Validate Xrm.Utility and proceed
        var alertStrings = { confirmButtonLabel: "OK", text: message, title: "" };
        var alertOptions = { height: 120, width: 260 };
        Xrm.Navigation.openAlertDialog(alertStrings, alertOptions);

    },


    filterSubgrid: function (executionContext) {


        var formContext = executionContext.getFormContext();
        //var params = new URLSearchParams(window.location.search);


        var storedContacts = sessionStorage.getItem("selectedContacts");

        if (!storedContacts) {
            console.log("No selected contacts found in sessionStorage.");
            return;
        }

        var selectedContacts = JSON.parse(storedContacts);
        if (selectedContacts.length < 2) {
            formContext.ui.tabs.get("ContactInfo_TAB").sections.get("MergeContacts_section").setVisible(false);
            console.log("Stored contacts are incomplete.");
            return;
        }

        var primaryContact = selectedContacts[0];
        var duplicateContact = selectedContacts[1];



        if (!primaryContact || !duplicateContact) {
            console.error("Contact IDs missing. Cannot filter subgrid.");
            return;
        }
        formContext.ui.tabs.get("ContactInfo_TAB").sections.get("MergeContacts_section").setVisible(true);
        // Get the Subgrid Control
        var subgrid = formContext.getControl("Subgrid_MeregeContacts");

        if (subgrid) {

            var fetchXmlfilter = `
                <filter type="or">
                    <condition attribute="contactid" operator="eq" value="${primaryContact}" />
             <condition attribute="contactid" operator="eq" value="${duplicateContact}" />
                </filter>`;

            subgrid.setFilterXml(fetchXmlfilter);
            subgrid.refresh();

        }

    },

    OnsearchName: function () {
        // Directive to prevent use of undeclared variables
        var executionContext = this.crm_ExecutionContext;
        var formContext = executionContext.getFormContext();
        try {
            var contactid = formContext.data.entity.getId().replace("{", "").replace("}", "");
            var lastName = formContext.getAttribute("lastname").getValue();
            var firstName = formContext.getAttribute("firstname").getValue();
            var birthDateAttribute = formContext.getAttribute("birthdate");
            var birthdate = birthDateAttribute.getValue();


            if (birthDateAttribute == null || birthDateAttribute.getValue() == null) {
                var msgTitle = "Date of Birth is Missing";
                var errMsg = "Date of Birth does not contains data.  Please verify and try again";
                var alertStrings = { confirmButtonLabel: "OK", text: errMsg, title: msgTitle };
                var alertOptions = { height: 240, width: 360 };
                Xrm.Navigation.openAlertDialog(alertStrings, alertOptions);
                return;

            }
            var formattedBirthdate = birthdate.toISOString().split('T')[0];
            var option = `?$filter=lastname eq '${lastName}' and firstname eq '${firstName}' and birthdate eq ${formattedBirthdate} and contactid ne '${contactid}' and statecode eq 0`;


            Xrm.WebApi.retrieveMultipleRecords("contact", option).then(
                function success(results) {
                    if (results.entities.length == 0) {
                        // Prompt message
                        var msgTitle = "No matching Contact is found in system";
                        var errMsg = "No matching Contact  is found.  Please verify and try again";
                        var alertStrings = { confirmButtonLabel: "OK", text: errMsg, title: msgTitle };
                        var alertOptions = { height: 240, width: 360 };
                        Xrm.Navigation.openAlertDialog(alertStrings, alertOptions);
                    }
                    else {

                        var ecer_clientid = results.entities[0].ecer_clientid;
                        var lastNameFromRecord = results.entities[0].lastname;
                        var firstNameFromRecord = results.entities[0].firstname;
                        var middleNameFromRecord = results.entities[0].middlename;
                        var preferredNameFromRecord = results.entities[0].ecer_preferredname;
                        var street1FromRecord = results.entities[0].address1_line1;
                        var cityFromRecord = results.entities[0].address1_city;
                        var provinceFromRecord = results.entities[0].address1_stateorprovince;
                        var postalcodeFromRecord = results.entities[0].address1_postalcode;
                        var countryFromRecord = results.entities[0].address1_country;
                        var emailFromRecord = results.entities[0].emailaddress1;
                        var primaryPhoneFromRecord = results.entities[0].telephone1;
                        var mobilePhoneFromRecord = results.entities[0].mobilephone;

                        var entityRecordId = results.entities[0].contactid;
                        var entityRecordName = results.entities[0].fullname;
                        var storedContacts = sessionStorage.getItem("selectedContacts");

                        if (storedContacts) {
                            sessionStorage.removeItem("selectedContacts"); // Clear previous data
                        }


                        sessionStorage.setItem("selectedContacts", JSON.stringify([contactid, results.entities[0].contactid]));

                        var orgUrl = Xrm.Utility.getGlobalContext().getClientUrl();
                        var duplicateRecordUrl = `${orgUrl}/main.aspx?pagetype=entityrecord&etn=contact&id=${entityRecordId}`;

                        // Not Exact Match in details.  Do we still want to use this lookup?
                        var msg = "Contact with Name#: " + firstName + " " + lastName + " & Date of Birth: " + formattedBirthdate + " found a match" +
                            "\nRecord found from system\n\n" +
                            "\nRegistration #: " + ecer_clientid +
                            "\nFirst Name: " + firstNameFromRecord +
                            "\nMiddle Name: " + middleNameFromRecord +
                            "\nLast Name: " + lastNameFromRecord +
                            "\nAddress: " + street1FromRecord +
                            "\nCity: " + cityFromRecord +
                            "\nProvince: " + provinceFromRecord +
                            "\nPostal Code: " + postalcodeFromRecord +
                            "\nCountry: " + countryFromRecord +
                            "\nEmail: " + emailFromRecord +
                            "\nPrimary Phone: " + primaryPhoneFromRecord +
                            "\nMobile Phone: " + mobilePhoneFromRecord +
                            "\n\nClick Open Records to use found result.";;
                        var msgTitle = "Duplicate Profile Information";

                        var confirmStrings = { confirmButtonLabel: "Open Records", cancelButtonLabel: "Cancel", text: msg, title: msgTitle };
                        var confirmOptions = { height: 640, width: 480 };
                        Xrm.Navigation.openConfirmDialog(confirmStrings, confirmOptions).then(
                            function (success) {
                                if (success.confirmed) {

                                    ECER.Jscripts.Contact.openMergeDialog(contactid, entityRecordId, duplicateRecordUrl);

                                }
                            }
                        );
                    }
                }
            );
        }
        catch (err) {
            throw new Error(err.message);
        }

    },


    onTempClientIDSearchButton: function () {
        // Directive to prevent use of undeclared variables
        var executionContext = this.crm_ExecutionContext;
        var formContext = executionContext.getFormContext();
        try {
            var contactid = formContext.data.entity.getId().replace("{", "").replace("}", "");
            var tempClientIDAttribute = formContext.getAttribute("ecer_tempclientid");


            if (tempClientIDAttribute == null || tempClientIDAttribute.getValue() == null || tempClientIDAttribute.getValue().trim() == '') {
                // Prompt message
                var msgTitle = "TempClientID is Missing";
                var errMsg = "TempClientID does not contains data.  Please verify and try again";
                var alertStrings = { confirmButtonLabel: "OK", text: errMsg, title: msgTitle };
                var alertOptions = { height: 240, width: 360 };
                Xrm.Navigation.openAlertDialog(alertStrings, alertOptions);
                return;
            }

            var tempClientID = tempClientIDAttribute.getValue().trim();

            var option = `?$filter=ecer_clientid eq '${tempClientID}' and contactid ne '${contactid}' and statecode eq 0`;

            Xrm.WebApi.retrieveMultipleRecords("contact", option).then(
                function success(results) {
                    if (results.entities.length == 0) {
                        // Prompt message
                        var msgTitle = "No matching Contact is found in system";
                        var errMsg = "No matching Contact with tempClientID #" + tempClientID + " is found.  Please verify and try again";
                        var alertStrings = { confirmButtonLabel: "OK", text: errMsg, title: msgTitle };
                        var alertOptions = { height: 240, width: 360 };
                        Xrm.Navigation.openAlertDialog(alertStrings, alertOptions);
                    }
                    else {
                        var ecer_clientid = results.entities[0].ecer_clientid;
                        var lastNameFromRecord = results.entities[0].lastname;
                        var firstNameFromRecord = results.entities[0].firstname;
                        var middleNameFromRecord = results.entities[0].middlename;
                        var preferredNameFromRecord = results.entities[0].ecer_preferredname;
                        var street1FromRecord = results.entities[0].address1_line1;
                        var cityFromRecord = results.entities[0].address1_city;
                        var provinceFromRecord = results.entities[0].address1_stateorprovince;
                        var postalcodeFromRecord = results.entities[0].address1_postalcode;
                        var countryFromRecord = results.entities[0].address1_country;
                        var emailFromRecord = results.entities[0].emailaddress1;
                        var primaryPhoneFromRecord = results.entities[0].telephone1;
                        var mobilePhoneFromRecord = results.entities[0].mobilephone;

                        var entityRecordId = results.entities[0].contactid;
                        var entityRecordName = results.entities[0].fullname;

                        var storedContacts = sessionStorage.getItem("selectedContacts");

                        if (storedContacts) {
                            sessionStorage.removeItem("selectedContacts"); // Clear previous data
                        }

                        sessionStorage.setItem("selectedContacts", JSON.stringify([contactid, results.entities[0].contactid]));

                        var orgUrl = Xrm.Utility.getGlobalContext().getClientUrl();
                        var duplicateRecordUrl = `${orgUrl}/main.aspx?pagetype=entityrecord&etn=contact&id=${entityRecordId}`;

                        // Not Exact Match in details.  Do we still want to use this lookup?
                        var msg = "Contact with ClientID#: " + ecer_clientid + " found a match" +
                            "\nRecord found from system\n\n" +
                            "\nFirst Name: " + firstNameFromRecord +
                            "\nMiddle Name: " + middleNameFromRecord +
                            "\nLast Name: " + lastNameFromRecord +
                            "\nAddress: " + street1FromRecord +
                            "\nCity: " + cityFromRecord +
                            "\nProvince: " + provinceFromRecord +
                            "\nPostal Code: " + postalcodeFromRecord +
                            "\nCountry: " + countryFromRecord +
                            "\nEmail: " + emailFromRecord +
                            "\nPrimary Phone: " + primaryPhoneFromRecord +
                            "\nMobile Phone: " + mobilePhoneFromRecord +
                            "\n\nClick Open Records to use found result.";;
                        var msgTitle = "Duplicate Profile Information";

                        var confirmStrings = { confirmButtonLabel: "Open Records", cancelButtonLabel: "Cancel", text: msg, title: msgTitle };
                        var confirmOptions = { height: 640, width: 480 };
                        Xrm.Navigation.openConfirmDialog(confirmStrings, confirmOptions).then(
                            function (success) {
                                if (success.confirmed) {

                                    ECER.Jscripts.Contact.openMergeDialog(contactid, entityRecordId, duplicateRecordUrl);

                                }
                            }
                        );
                    }
                }
            );
        }
        catch (err) {
            throw new Error(err.message);
        }
    },


    openMergeDialog: function (contact1, contact2, url) {

        if (!contact1 || !contact2) {
            Xrm.Navigation.openAlertDialog({ text: "Select at least two records to merge." });
            return;
        }

        var entityName = "contact";
        var formId = "584c0b28-c7e4-ef11-be21-6045bdf9b81b";



        var pageInput = {
            pageType: "entityrecord",
            entityName: entityName,
            formId: formId,
            entityId: contact1,

        };

        var navigationOptions = {
            target: 2, // Open as a modal dialog
            width: 800,
            height: 600
        };

        Xrm.Navigation.navigateTo(pageInput, navigationOptions).then(
            function () {
                console.log("Merge Form opened successfully.");
            },
            function (error) {
                console.log("Error opening Merge Form: " + error.message);
            }
        );


    },
    onGenerateCommunicationOnIDRejectButton: function () {
        var executionContext = this.crm_ExecutionContext;
        var formContext = executionContext.getFormContext();
        try {
            var fieldName = "ecer_generatecommunicationfromidrejected"; // Ensure this is correct
            var fieldAttribute = formContext.getAttribute(fieldName);

            if (fieldAttribute) {
                // Assuming the field is an optionset, ensure 621870000 is the correct value.
                // If it's a two options (boolean) field, use true or false instead.
                var YES_OPTION_VALUE = 621870000;
                fieldAttribute.setValue(YES_OPTION_VALUE);
                formContext.data.save();
            } else {
                console.error("Field not found: " + fieldName);
            }
        } catch (err) {
            console.error("Error in onGenerateCommunicationOnIDRejectButton: " + err.message);
        }
    },
}