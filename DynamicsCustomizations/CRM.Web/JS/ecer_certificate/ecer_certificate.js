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
        ECER.Jscripts.Certificate.registrantHasActiveCondition(executionContext);
        ECER.Jscripts.Certificate.LockHasCurrentCertificateConditionsUnlessInvestigation(executionContext);
    },

    LockHasCurrentCertificateConditionsUnlessInvestigation: function (executionContext) {
        var hasInvestigationBaselineRole = crm_Utility.checkCurrentUserRole("Investigation - Baseline Role");
        var hasSystemAdministrator = crm_Utility.checkCurrentUserRole("System Administrator");
        crm_Utility.enableDisable(executionContext, !(hasSystemAdministrator || hasInvestigationBaselineRole), "ecer_ineligiblereference");
    },

    registrantHasActiveCondition: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var applicantAttributeName = "ecer_registrantid";
        var applicantAttribute = formContext.getAttribute(applicantAttributeName);
        var applicant = applicantAttribute.getValue();
        if (applicant === null) {
            return null;
        }
        var applicantid = applicant[0].id.replace("{", "").replace("}", "");
        ECER.Jscripts.Contact?.registrantHasActiveCondition(executionContext, applicantid);
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
    },

    // We have used a Power Automate Approach instead of using JavaScript
    generateCertificate: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var generateCertificate = formContext.getAttribute("ecer_generatecertificate").getValue();
        if (generateCertificate) {
            var certificateId = formContext.data.entity.getId().toLowerCase().replace('{', '').replace('}', '');

            var query = "id=87834a5f-e91d-ef11-840b-0022486e1cec&iscustomreport=true&reporttypecode=1&reportName=Certificate&isScheduledReport=false&CRM_Filter=%3CReportFilter%3E%3CReportEntity+paramname%3D%22CRM_Filteredecer_Certificate%22+displayname%3D%22Certificates%22+donotconvert%3D%221%22%3E%3Cfetch+version%3D%221.0%22+output-format%3D%22xml-platform%22+mapping%3D%22logical%22+distinct%3D%22false%22%3E%3Centity+name%3D%22ecer_certificate%22%3E%3Call-attributes%2F%3E%3Cfilter+type%3D%22and%22%3E%3Ccondition+attribute%3D%22ecer_certificateid%22+operator%3D%22eq%22+value%3D%22" +
                certificateId +
                "%22%2F%3E%3C%2Ffilter%3E%3C%2Fentity%3E%3C%2Ffetch%3E%3C%2FReportEntity%3E%3C%2FReportFilter%3E";

            var arrResponseSession = ECER.Jscripts.Certificate.executeSSRSReport(query);
            ECER.Jscripts.Certificate.convertReportToPDF(arrResponseSession, "CertificateFromJS.pdf", "ecer_certificate", certificateId, "Certificate");
            formContext.getAttribute("ecer_generatecertificate").setValue(false);
        }
    },

    executeSSRSReport: function (query) {
        var globalContext = Xrm.Utility.getGlobalContext();
        var serverUrl = globalContext.getClientUrl();
        if (serverUrl.match(/\/$/)) {
            serverUrl = serverUrl.substring(0, serverUrl.length - 1);
        }

        // URL of the report server which will execute report and generate response.

        var pth = serverUrl + "/CRMReports/rsviewer/reportviewer.aspx"

        //Prepare request object to execute the report.
        var retrieveEntityReq = new XMLHttpRequest();
        retrieveEntityReq.open("POST", pth, false);
        retrieveEntityReq.setRequestHeader("Accept", "*/*");
        retrieveEntityReq.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        //This statement runs the query and executes the report synchronously.
        retrieveEntityReq.send(query);

        //These variables captures the response and returns the response in an array.
        var x = retrieveEntityReq.responseText.lastIndexOf("ReportSession=");
        var y = retrieveEntityReq.responseText.lastIndexOf("ControlID=");

        var ret = new Array();
        ret[0] = retrieveEntityReq.responseText.substr(x + 14, 24);
        ret[1] = retrieveEntityReq.responseText.substr(y + 10, 32);

        //Returns the response as an Array.

        return ret;
    },

    convertReportToPDF: function (arrResponseSession, fileName, regardingObjectName, regardingObjectId, tag) {
        var globalContext = Xrm.Utility.getGlobalContext();
        var serverUrl = globalContext.getClientUrl();
        if (serverUrl.match(/\/$/)) {
            serverUrl = serverUrl.substring(0, serverUrl.length - 1);
        }

        // The Goal: Using the Response Session, which contains the Report Session and Control ID From Report Execution
        var pth = serverUrl + "/Reserved.ReportViewerWebControl.axd?ReportSession="
            + arrResponseSession[0] +
            "&Culture=1033&CultureOverrides=True&UICulture=1033&UICultureOverrides=True&ReportStack=1&ControlID="
            + arrResponseSession[1] +
            "&OpType=Export&FileName=Public&ContentDisposition=OnlyHtmlInline&Format=PDF";

        //Create request object that will be called to convert the response in PDF base 64 string.

        var retrieveEntityReq = new XMLHttpRequest();
        retrieveEntityReq.open("GET", pth, true);
        retrieveEntityReq.setRequestHeader("Accept", "*/*");
        retrieveEntityReq.responseType = "arraybuffer";
        retrieveEntityReq.onreadystatechange = function () { // This is the callback function.
            if (retrieveEntityReq.readyState == 4 && retrieveEntityReq.status == 200) {
                var binary = "";
                var bytes = new Uint8Array(this.response);
                for (var i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                //This is the base 64 PDF formatted string and is ready to pass to the action as an input parameter.
                var base64PDFString = window.btoa(binary);
                //4. Call Action and pass base 64 string as an input parameter. That’s it.
                ECER.Jscripts.Certificate.uploadToDocumentStorage(fileName, base64PDFString, regardingObjectName, regardingObjectId, tag);
            }
        };
        retrieveEntityReq.send();
    },

    uploadToDocumentStorage: function (fileName, base64PDFString, regardingObjectName, regardingObjectId, tag) {
        var globalContext = Xrm.Utility.getGlobalContext();
        var serverUrl = globalContext.getClientUrl();
        if (serverUrl.match(/\/$/)) {
            serverUrl = serverUrl.substring(0, serverUrl.length - 1);
        }

        var parameters = {};
        parameters.FileName = fileName;
        parameters.Body = base64PDFString;
        parameters.RegardingObjectName = regardingObjectName.toLowerCase();
        parameters.RegardingObjectId = regardingObjectId.replace("{", "").replace("}", "");
        parameters.Origin = 931490002; //User Upload
        parameters.Tag1 = tag;

        var req = new XMLHttpRequest();
        req.open("POST", serverUrl + "/api/data/v9.2/bcgov_UploadDocumentToSharePoint", false);
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        req.setRequestHeader("Accept", "application/json");
        req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        req.onreadystatechange = function () {
            if (this.readyState === 4) {
                req.onreadystatechange = null;
                if (this.status === 200) {
                    var results = JSON.parse(this.response);

                    if (results.IsSuccess == true) {
                        // No Spinner to stop.... Should we reset the flag?
                        // Or move this to Certifcate only for now?
                    }
                    else {
                        maybeStopSpinner();
                        var error1 = results.Result;
                        if (error1 != null) {
                            var alertStrings1 = { text: error1 };
                            Xrm.Navigation.openAlertDialog(alertStrings1);
                        }
                    }
                } else {
                    maybeStopSpinner();
                    var error = JSON.parse(this.response).error;
                    if (error != null) {
                        var alertStrings = { text: error.message };
                        Xrm.Navigation.openAlertDialog(alertStrings);
                    }
                }
            }
        };
        req.send(JSON.stringify(parameters));
    }
}


