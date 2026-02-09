// Javascript source code

if (typeof ECER === "undefined") {
    var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {}
}

ECER.Jscripts.PostSecondaryInstitute= {
    crm_ExecutionContext: null,
    onLoad: function (executionContext) {
        this.showPSPReferalNotification(executionContext);
      
    },
  
    showPSPReferalNotification: function (executionContext) {
        
        var formContext = executionContext.getFormContext();
        var pspinstitutionId =  formContext.data.entity.getId().replace(/[{}]/g, "");
        var option = `?$filter=_ecer_pspinstitution_value eq ${pspinstitutionId} and statecode eq 0`;
        Xrm.WebApi.retrieveMultipleRecords("ecer_pspreferral", option)
            .then(function(result) {
                var count = result.entities.length;
               if(count > 0){
                formContext.ui.setFormNotification(
                    "An active PSP Referral exists for this institution. Please review it before making changes.",
                    "WARNING","PSP REFERERAL NOTIFICTION");
                    formContext.ui.tabs.get("tab_pspreferral").setVisible(true);
               }
            })
            .catch(function(error) {
                console.error("Error retrieving PSP refereral count ", error.message);
            });



    }
    
    
   
}


