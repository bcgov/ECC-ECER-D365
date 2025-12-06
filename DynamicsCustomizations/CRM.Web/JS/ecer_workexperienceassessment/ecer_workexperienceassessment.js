// Javascript source code

if (typeof ECER === "undefined") {
	var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
	ECER.Jscripts = {}
}

ECER.Jscripts.WorkExperienceAssessment = {
	crm_ExecutionContext: null,
	onLoad: function (executionContext) {
		this.crm_ExecutionContext = executionContext;
		ECER.Jscripts.WorkExperienceAssessment.showHide400500OnType(executionContext);
	},

	showHide400500OnType: function (executionContext) {
		var qv500 = "qv_workexp500";
		var qv400 = "qv_workexp400";
		var workExperienceAttributeName = "ecer_workexprefid";
		var formContext = executionContext.getFormContext();
		var workExperienceReferenceValue = formContext.getAttribute(workExperienceAttributeName).getValue();
		if (workExperienceReferenceValue !== null) {
			var workExpRefId = workExperienceReferenceValue[0].id.replace("{", "").replace("}", "");
			Xrm.WebApi.retrieveRecord("ecer_workexperienceref", workExpRefId).then(
				function success(record) {
					var type = record.ecer_type;
					var is400 = (type === 621870000);
					var is500 = (type === 621870001 || type === 621870002); // ICRA or 500 will use the 500 QV

					crm_Utility.showHide(executionContext, is400, qv400);
					crm_Utility.showHide(executionContext, is500, qv500);
				}
			);
		}

	},

	onSearchReferenceButton: function () {
		// Directive to prevent use of undeclared variables
		var executionContext = this.crm_ExecutionContext;
		var formContext = executionContext.getFormContext();
		var lookupAttributeName = "ecer_workexprefid";
		var lookupAttribute = formContext.getAttribute(lookupAttributeName);
		if (lookupAttribute != null) {
			var lookupValue = lookupAttribute.getValue();
			if (lookupValue != null) {
				var lookupId = lookupValue[0].id.toLowerCase().replace("{", "").replace("}", "");
				Xrm.WebApi.retrieveRecord("ecer_workexperienceref", lookupId).then(
					function success(record) {
						// Obtained values from work experience reference
						var ReferenceFirstName = record.ecer_firstname;
						var ReferenceLastName = record.ecer_lastname;
						var ReferenceNumber = record.ecer_referenceececertificationnumber;
						var ReferenceEmail = record.ecer_emailaddress;
						var ReferencePhone = record.ecer_phonenumber;

						// Search for existing profile
						try {

							var refContactAttribute = formContext.getAttribute("ecer_referencecontactid");

							if (ReferenceNumber == null || ReferenceNumber.trim() == '') {
								// Prompt message
								var msgTitle = "Reference ECE Certificate Number does not contains data";
								var errMsg = "Reference ECE Certificate Number does not contains data.  Please verify and try again";
								var alertStrings = { confirmButtonLabel: "OK", text: errMsg, title: msgTitle };
								var alertOptions = { height: 240, width: 360 };
								Xrm.Navigation.openAlertDialog(alertStrings, alertOptions);
								return;
							}

							var currentCertificateNumber = ReferenceNumber;
							// Compose Query for search contact records with same client ID
							var option = "?$filter=ecer_clientid eq '" + currentCertificateNumber + "' and statecode eq 0";
							Xrm.WebApi.retrieveMultipleRecords("contact", option).then(
								function success2(results) {
									if (results.entities.length == 0) {
										// Prompt message
										var msgTitle = "No matching Registrant is found in system";
										var errMsg = "No matching Registrant with Certificate #" + currentCertificateNumber + " is found.  Please verify and try again";
										var alertStrings = { confirmButtonLabel: "OK", text: errMsg, title: msgTitle };
										var alertOptions = { height: 240, width: 360 };
										Xrm.Navigation.openAlertDialog(alertStrings, alertOptions);
										formContext.getControl("ecer_referencecontactid").setDisabled(false);
									}
									else {
										var lastNameFromRecord = results.entities[0].lastname;
										var firstNameFromRecord = results.entities[0].firstname;
										var emailFromRecord = results.entities[0].emailaddress1;
										var primaryPhoneFromRecord = results.entities[0].telephone1;

										var entityRecordId = results.entities[0].contactid;
										var entityRecordName = results.entities[0].fullname;

										var lastName = ReferenceLastName;
										var firstName = ReferenceFirstName;
										var email = ReferenceEmail;
										var primaryPhone = ReferencePhone;

										var totalMatch = lastNameFromRecord == lastName &&
											firstNameFromRecord == firstName &&
											email == emailFromRecord &&
											primaryPhone == primaryPhoneFromRecord;

										if (totalMatch) {
											var lookupArray = new Array();
											lookupArray[0] = new Object();
											// Treat the entity record to include curly braces if needed
											if (entityRecordId.indexOf("{") === -1) {
												entityRecordId = "{" + entityRecordId + "}";
											}
											lookupArray[0].id = entityRecordId;
											lookupArray[0].name = entityRecordName;
											lookupArray[0].entityType = "contact";
											refContactAttribute.setValue(lookupArray);
											formContext.data.save();

											return; // Exit upon setting lookup with the contact record.
										}

										// Not Exact Match in details.  Do we still want to use this lookup?
										var msg = "Certificate #: " + currentCertificateNumber + " profile found is not matching 100%" +
											"\nRecord found from system\n\n" +
											"\nFirst Name: " + firstNameFromRecord +
											"\nLast Name: " + lastNameFromRecord +
											"\nEmail: " + emailFromRecord +
											"\nPrimary Phone: " + primaryPhoneFromRecord +
											"\n\n\n" +
											"\nClick Confirm to Associate Profile anyway or Cancel for other options";
										var msgTitle = "Confirm using this Profile Information";

										var confirmStrings = { confirmButtonLabel: "Confirm", cancelButtonLabel: "Cancel", text: msg, title: msgTitle };
										var confirmOptions = { height: 360, width: 480 };
										Xrm.Navigation.openConfirmDialog(confirmStrings, confirmOptions).then(
											function (success) {
												if (success.confirmed) {

													var lookupArray = new Array();
													lookupArray[0] = new Object();
													// Treat the entity record to include curly braces if needed
													if (entityRecordId.indexOf("{") === -1) {
														entityRecordId = "{" + entityRecordId + "}";
													}
													lookupArray[0].id = entityRecordId;
													lookupArray[0].name = entityRecordName;
													lookupArray[0].entityType = "contact";
													refContactAttribute.setValue(lookupArray);
													formContext.data.save();

												}
												else {
													// ref contact control set disable
													formContext.getControl("ecer_referencecontactid").setDisabled(false);
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

					}

					// End of First Retrieve
				);
			}
		}

	},
}
