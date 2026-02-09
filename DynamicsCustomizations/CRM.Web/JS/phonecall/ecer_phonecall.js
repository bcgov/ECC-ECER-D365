if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.PhoneCall =
{
    onLoad: function (executionContext) {
       ECER.Jscripts.PhoneCall.labelByDirection(executionContext);
    },

    labelByDirection: function (executionContext) {
        // ECER-3634
        // IF Direction is outgoing, then Call From is Call From, and Call To is Call To
        // IF Direction is Incoming, then Call From is re-labelled to Call To,and Call To is re-labelled to Call From

        var formContext = executionContext.getFormContext();
        var incoming = 0;
        var outgoing = 1;
        var directionAttributeName = "ecer_calldirection";
        var callFromAttributeName = "from";
        var callToAttributeName = "to";
        var directionAttribute = formContext.getAttribute(directionAttributeName);
        var callFromLabel = "Call From";
        var callToLabel = "Call To";
        if (directionAttribute != null && directionAttribute.getValue() !== null && directionAttribute.getValue() !== outgoing) {
            callFromLabel = "Call To";
            callToLabel = "Call From";
        }

        var callFromControl = formContext.getControl(callFromAttributeName);
        var callToControl = formContext.getControl(callToAttributeName);
        if (callFromControl != null) {
            callFromControl.setLabel(callFromLabel);
        }
        if (callToControl != null) {
            callToControl.setLabel(callToLabel);
        }
    }
}