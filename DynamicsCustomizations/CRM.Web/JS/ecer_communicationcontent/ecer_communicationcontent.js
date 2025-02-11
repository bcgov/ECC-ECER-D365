// Javascript source code

if (typeof ECER === "undefined") {
    var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {}
}

ECER.Jscripts.CommunicationContent = {
    crm_ExecutionContext: null,
    onLoad: function (executionContext) {
        this.crm_ExecutionContext = executionContext;
        try {
            // ECER.Jscripts.CommunicationContent.populateInitiatedFromAtForm(executionContext);
            
        }
        catch (ex) {
            // Do Nothing.  Mysterious issue when trying to save with No Dirty Fields
            // Throws script error of method not found when hitting "Save" multiple times.
        }
    },

    sourceToText: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var sourceAttribute = "ecer_source";
        var textAttribute = "ecer_text";
        var textAttribute = formContext.getAttribute(textAttribute);
        var sourceAttribute = formContext.getAttribute(sourceAttribute);
        if (sourceAttribute != null && sourceAttribute.getValue() != null) {
            textAttribute.setValue(sourceAttribute.getValue());
        }
    },

    textToSource: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var sourceAttribute = "ecer_source";
        var textAttribute = "ecer_text";
        var textAttribute = formContext.getAttribute(textAttribute);
        var sourceAttribute = formContext.getAttribute(sourceAttribute);
        if (textAttribute != null && textAttribute.getValue() != null) {
            sourceAttribute.setValue(textAttribute.getValue());
        }
    }

}


