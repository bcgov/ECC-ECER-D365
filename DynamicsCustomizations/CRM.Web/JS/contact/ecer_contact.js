// JavaScript source code

if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.Contact = {
	onLoad: function (executionContext) {
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
            var isOver19 = false;
            var birthDateAttribute = formContext.getAttribute("birthdate");
            if (birthDateAttribute != null && birthDateAttribute.getValue() != null) {
                var birthDate = birthDateAttribute.getValue();
                var today = new Date();
                var diff = (today.getTime() - birthDate.getTime()) / 1000;
                diff /= (60 * 60 * 24);
                var differenceInYears = Math.abs(Math.round(diff / 365.25));
                if (differenceInYears >= 19) {
                    isOver19 = true;
                }
            }
            var isUnder19Attribute = formContext.getAttribute("ecer_isunder19");
            if (isUnder19Attribute != null) {
                var isUnder19Value = isUnder19Attribute.getValue();
                // Set value if the value is different
                if (isUnder19Value != 621870000 && !isOver19) {
                    isUnder19Attribute.setValue(621870000);
                    formContext.data.save();
                }
                else if (isUnder19Value != 621870001 && isOver19) {
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
            
        }
	
}

