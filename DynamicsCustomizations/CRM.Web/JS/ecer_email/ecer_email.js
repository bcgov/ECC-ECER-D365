if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}


ECER.Jscripts.Email =
{
    onLoad: function (executionContext) {
        
        ECER.Jscripts.Email.setFromLookup(executionContext);
       
        
    },
    //ECER-4698
    setFromLookup(executionContext){

        var formContext = executionContext.getFormContext();
        var from = null;
        var user = null;
        
        var formType = formContext.ui.getFormType();
        if (formType !== 1) {// check if its create
            return;
        }

        var programSupportRole = crm_Utility.checkCurrentUserRole("Certification - Program Support Role");
        var programSupportLeadRole = crm_Utility.checkCurrentUserRole("Certification - Program Support Lead Role");

        var pspProgramAnalystRole = crm_Utility.checkCurrentUserRole("PSP - Program Analyst");
        var pspProgramCodinatorRole = crm_Utility.checkCurrentUserRole("PSP - Program Coordinator");
        var pspProgramDirectorRole = crm_Utility.checkCurrentUserRole("PSP - Program Director");

        var investigationBaseRole = crm_Utility.checkCurrentUserRole("Investigation - Baseline Role");
      

        if(pspProgramAnalystRole||  pspProgramCodinatorRole || pspProgramDirectorRole){
            from = this.getQueueLookup("ECERegistry.Programs@gov.bc.ca");
        }
        else if(programSupportRole || programSupportLeadRole){
            from = this.getQueueLookup("ECERegistry.Intake@gov.bc.ca");
        } else {
            if (!investigationBaseRole) {
                from = this.getQueueLookup("ECERegistry@gov.bc.ca");
            }
        }
        if(from && from !== null){
            var fromlookup = crm_Utility.generateLookupObject("queue", from.queueid, from.name);
            crm_Utility.setLookupValue(executionContext,"from", fromlookup);
        }
       

    },
    getQueueLookup(queueName){
       
        var queue = null;
    
        var queueQueryOption = `?$filter=name eq '${queueName}' and statecode eq 0`;
        queue = crm_Utility.retrieveMultipleCustom("queue", queueQueryOption);
        return queue[0];
    }
 
}