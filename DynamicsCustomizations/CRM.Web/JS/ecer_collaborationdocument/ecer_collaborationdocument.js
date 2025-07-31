// Javascript source code

if (typeof ECER === "undefined") {
    var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {}
}

ECER.Jscripts.CollaborationDocument= {
    crm_ExecutionContext: null,
    onLoad: function (executionContext) {
        ECER.Jscripts.CollaborationDocument.setPrimaryOwner(executionContext);
      
    },
  //ECER-4952 setting primary owner
    setPrimaryOwner: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var  ownerattribute =formContext.getAttribute("ownerid");

        var formType = formContext.ui.getFormType();
        var createMode = (formType == 1);

        if( ownerattribute && ownerattribute.getValue !== null && createMode)
        {
            var owner = ownerattribute.getValue();
            formContext.getAttribute("ecer_primaryowner").setValue(owner);


        }
    
    


    }
    
    
   
}


