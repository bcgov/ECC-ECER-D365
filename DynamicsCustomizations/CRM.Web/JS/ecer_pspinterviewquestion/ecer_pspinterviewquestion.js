// JavaScript source code

if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}

ECER.Jscripts.PSPInterviewQuestion = {
    onLoad: function (executionContext) {
        let formContext = executionContext.getFormContext();

        let answer = formContext.getAttribute("ecer_answer");
        let answerPlainText = formContext.getAttribute("ecer_answerplaintext");

        // Case when answer plain test is entered from editable grid
        if (answer?.getValue() === null && answerPlainText?.getValue() != null) {
            answer?.setValue(answerPlainText?.getValue());
        }

        formContext.data.save();
    },
    onSave: function (executionContext) {
        this.onChangeDetails(executionContext);
    },
    onChangeDetails: function (executionContext) {
        // check if details is dirty
        let formContext = executionContext.getFormContext();

        let answer = formContext.getAttribute("ecer_answer");

        if (answer === null
            || !answer.getIsDirty()
            || !DOMParser) {
            return;
        }

        if (answer.getValue() != null) {
            //ecer_detailstext is has string data from HTML in ecer_details
            var parsedString = (new DOMParser()).parseFromString(answer.getValue(), 'text/html');

            formContext.getAttribute("ecer_answerplaintext")?.setValue(parsedString?.body?.textContent);
        }
        else {
            formContext.getAttribute("ecer_answerplaintext")?.setValue(null);
        }
    }
}