// Javascript source code

if (typeof ECER === "undefined") {
    var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {}
}

ECER.Jscripts.Certificate = {
    onLoad: function (executionContext) {
        ECER.Jscripts.Certificate.hideCancelledStatusReasonBySecurityRole(executionContext);

    },


    hideCancelledStatusReasonBySecurityRole: function (executionContext) {
        // ECER.Jscripts.Certificate.hideCancelledStatusReasonBySecurityRole
        // ECER-2663
        var managerOfCertificationRole = crm_Utility.checkCurrentUserRole("Certifications - Manager of Certifications Role");
        var systemAdministratorRole = crm_Utility.checkCurrentUserRole("System Administrator");
        var programSupportOperationSupervisorRole = crm_Utility.checkCurrentUserRole("Certification - Operations Supervisor Program Support Role");
        var equivalencyOperationSupervisorRole = crm_Utility.checkCurrentUserRole("Equivalency - Operations Supervisor Equivalency Role");
        var operationSupervisorRole = crm_Utility.checkCurrentUserRole("Certification - Operations Supervisor Assessment Role");
        var cancelledStatusReason = "621870003"; // Need to be in string

        if (!(managerOfCertificationRole || programSupportOperationSupervisorRole ||
            equivalencyOperationSupervisorRole || operationSupervisorRole)) {
            crm_Utility.filterOutOptionSet(executionContext, "statuscode", cancelledStatusReason);
            crm_Utility.filterOutOptionSet(executionContext, "header_statuscode", cancelledStatusReason);
        }
    }
}


