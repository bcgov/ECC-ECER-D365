if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.ProgramApplication =
{
    onLoad: function (executionContext) {
        var formContext = executionContext.getFormContext();

        ECER.Jscripts.ProgramApplication.setSignature(executionContext);
        ECER.Jscripts.ProgramApplication.restrictStatusReasonAccess(executionContext);
        ECER.Jscripts.ProgramApplication.setPSPRepresentative(executionContext);
    },

    setPSPRepresentative: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var psiRepresentativeAttributeName = "ecer_psiprogramrepresentative";
        var psiRepresentativeAttribute = formContext.getAttribute(psiRepresentativeAttributeName);
        // ECER-5053


        if (psiRepresentativeAttribute == null) {
            // If New Attribute does not exist
            // Or it has already populated with value, then ignore
            return;
        }

        var psi = formContext.getAttribute("ecer_postsecondaryinstitute").getValue();
        if (psi == null) {
            // Value should be based from Post Secondary Institute.  Without PSI, query cannot be created
            psiRepresentativeAttribute.setValue(null);
            psiRepresentativeAttribute.fireOnChange();
            return;
        }

        if (psiRepresentativeAttribute.getValue() != null) {
            // Ignore if field already contains data
            return;
        }

        psiId = psi[0].id.replace('{', '').replace('}', '');
        psiName = psi[0].name;
        var hasSetValue = false;
        var psiRepresentativeEntityLogicalName = "ecer_eceprogramrepresentative";
        // For Legacy Data that uses contact as Program Representative Lookup
        var contactRepresentativeAttribute = formContext.getAttribute("ecer_programrepresentative");
        if (contactRepresentativeAttribute != null && contactRepresentativeAttribute.getValue() != null) {
            // Contact Representative Attribute will be removed from Form after several months of this change
            var contactRepresentative = contactRepresentativeAttribute.getValue();
            if (contactRepresentative != null) {
                var contact = crm_Utility.retrieveRecordCustom(contactRepresentative[0].id, contactRepresentative[0].entityType);
                if (contact != null) {
                    var contactFirstName = contact.firstname;
                    var contactLastName = contact.lastname;

                    // Use the contact first name and last name with the psi to query the PSI Program Representative record
                    var psiRepViaContactOption = "?$filter=ecer_firstname eq '" + contactFirstName + "' and ecer_lastname eq '" + contactLastName + "' and _ecer_postsecondaryinstitute_value eq '" + psiId + "' and statecode eq 0 &$orderby=modifiedon desc";
                    var psiRepsRetrieved = crm_Utility.retrieveMultipleCustom(psiRepresentativeEntityLogicalName, psiRepViaContactOption);
                    if (psiRepsRetrieved != null && psiRepsRetrieved.length > 0) {
                        var pspRepFromContact = crm_Utility.generateLookupObject(psiRepresentativeEntityLogicalName, psiRepsRetrieved[0].ecer_eceprogramrepresentativeid, psiRepsRetrieved[0].ecer_name);
                        crm_Utility.setLookupValue(executionContext, psiRepresentativeAttributeName, pspRepFromContact);
                        psiRepresentativeAttribute.fireOnChange();
                        hasSetValue = true;
                    }
                }
            }
        }

        if (!hasSetValue) {
            // Obtain the last modified Primary PSI Program Representative 
            var psiRepPrimaryOption = "?$filter=_ecer_postsecondaryinstitute_value eq '" + psiId + "' and statecode eq 0 and ecer_representativerole eq 621870000&$orderby=modifiedon desc";
            var primaryPsiRepsRetrieved = crm_Utility.retrieveMultipleCustom(psiRepresentativeEntityLogicalName, psiRepPrimaryOption);
            if (primaryPsiRepsRetrieved != null && primaryPsiRepsRetrieved.length > 0) {
                var pspPrimaryRep = crm_Utility.generateLookupObject(psiRepresentativeEntityLogicalName, primaryPsiRepsRetrieved[0].ecer_eceprogramrepresentativeid, primaryPsiRepsRetrieved[0].ecer_name);
                crm_Utility.setLookupValue(executionContext, psiRepresentativeAttributeName, pspPrimaryRep);
                psiRepresentativeAttribute.fireOnChange();
                hasSetValue = true;
            }
        }
    },

    restrictStatusReasonAccess: function (executionContext) {
        // ECER-2551
        var programDirectorRole = crm_Utility.checkCurrentUserRole("PSP - Program Director");
        var programAnalystRole = crm_Utility.checkCurrentUserRole("PSP - Program Analyst");
        var sysAdminRole = crm_Utility.checkCurrentUserRole("System Administrator");
        var isDisable = !(programDirectorRole || programAnalystRole || sysAdminRole);
        crm_Utility.enableDisable(executionContext, isDisable, "header_statuscode");
        crm_Utility.enableDisable(executionContext, isDisable, "statuscode");
    },

    setLookupField: function (lookupField, id, name, entityType) {
        var lookupValue = new Array();
        lookupValue[0] = new Object();
        lookupValue[0].id = id;
        lookupValue[0].name = name;
        lookupValue[0].entityType = entityType;
        lookupField.setValue(lookupValue);
    },

    setSignature: function (executionContext) {
        var formContext = executionContext.getFormContext();

        var pspSignature = formContext.getAttribute("ecer_pspsignature");
        if (pspSignature == null) return;

        // Get current user
        var userSettings = Xrm.Utility.getGlobalContext().userSettings;
        var currentuserid = userSettings.userId.replace("{", "").replace("}", "");
        var username = userSettings.userName;

        // Get PSP Signature
        Xrm.WebApi.retrieveMultipleRecords("ecer_signature", "?$select=ecer_signatureid&$filter=_ecer_nameid_value eq " + currentuserid).then(
            function success(results) {
                console.log(results);
                if (results.entities.length > 0) {
                    var result = results.entities[0];
                    // Columns
                    var ecer_signatureid = result["ecer_signatureid"]; // Guid
                    var ecer_name = result["ecer_name"]

                    // Set PSP Signature
                    ECER.Jscripts.ProgramApplication.setLookupField(pspSignature, ecer_signatureid, ecer_name, "ecer_signature");

                    formContext.data.entity.save();
                }
            },
            function (error) {
                console.log(error.message);
            }
        );
    },
}