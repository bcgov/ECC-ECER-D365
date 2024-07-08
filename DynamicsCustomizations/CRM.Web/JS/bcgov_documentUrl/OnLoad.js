function OnLoad(executionContext) {
    var formContext = executionContext.getFormContext();
    if (formContext.ui.getFormType() == 2) { // Update

        ShowLookup(formContext, "bcgov_customer");
        ShowLookup(formContext, "bcgov_emailid");
        ShowLookup(formContext, "bcgov_appointmentid");
        ShowLookup(formContext, "bcgov_faxid");
        ShowLookup(formContext, "bcgov_letterid");
        ShowLookup(formContext, "bcgov_phonecallid");
        ShowLookup(formContext, "bcgov_taskid");
        ShowLookup(formContext, "bcgov_caseid");
        ShowLookup(formContext, "ecer_applicationid");
        ShowLookup(formContext, "ecer_investigationid");
        ShowLookup(formContext, "ecer_investigationinterviewid");
        ShowLookup(formContext, "ecer_pspsitevisitid");
        ShowLookup(formContext, "ecer_communicationid");
        ShowLookup(formContext, "ecer_certificateid");
        ShowLookup(formContext, "ecer_previousnameid");
    }
};

function ShowLookup(formContext, fieldName) {
    if (formContext.getControl(fieldName) != null && formContext.getAttribute(fieldName).getValue() != null && formContext.getAttribute(fieldName).getValue().length > 0)
        formContext.getControl(fieldName).setVisible(true);
};