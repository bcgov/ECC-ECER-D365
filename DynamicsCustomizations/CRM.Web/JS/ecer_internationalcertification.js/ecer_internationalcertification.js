// JavaScript source code
if (typeof ECER === "undefined") {
	var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
	ECER.Jscripts = {};
}

ECER.Jscripts.InternationalCertification =
{
	crm_ExecutionContext: null,
	OnLoad: function (executionContext) {
		this.crm_ExecutionContext = executionContext;
		ECER.Jscripts.InternationalCertification.DisableCertificateInformationSectionFieldsIfPortal(executionContext);
	},

	// ECER-4777
	DisableCertificateInformationSectionFieldsIfPortal: function (executionContext) {
		var formContext = executionContext.getFormContext();
		var internationalCertificationApplicationId = formContext.getAttribute("ecer_applicationid").getValue();
		if (internationalCertificationApplicationId == null) {
			return;
		}
		var internationalCertificationApplicationIdCleanGUID = internationalCertificationApplicationId[0].id.replace("{", "").replace("}", "");
		Xrm.WebApi.retrieveRecord("ecer_application", internationalCertificationApplicationIdCleanGUID, "?$select=ecer_origin").then(
			function success(result) {
				var originValue = result.ecer_origin;
				var fromPortal = originValue == 621870001;
				crm_Utility.enableDisable(executionContext, fromPortal, "ecer_certificationstatus");
				crm_Utility.enableDisable(executionContext, fromPortal, "ecer_certificatetitle");
				crm_Utility.enableDisable(executionContext, fromPortal, "ecer_issuedate");
				crm_Utility.enableDisable(executionContext, fromPortal, "ecer_expirydate");
				crm_Utility.enableDisable(executionContext, fromPortal, "ecer_certificatehasothername");
			},
			function (error) {
				console.log(error.message);
			}
		);
	}
	// ECER-4777

} // JavaScript source code