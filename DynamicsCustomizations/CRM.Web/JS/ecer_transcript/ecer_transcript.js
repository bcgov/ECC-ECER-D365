if (typeof ECER === "undefined") {
    var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {};
}


ECER.Jscripts.Transcript =
{
    onLoad: function (executionContext) {
        var formContext = executionContext.getFormContext();

        ECER.Jscripts.Transcript.courseOutlineSectionShowHide(executionContext);
        ECER.Jscripts.Transcript.showHideEquivalencyFields(executionContext);
        ECER.Jscripts.Transcript.shownOnPSIeqOther(executionContext);

    },
    //ECER-4410
    //When Education Origin = Not Recognized on education transcript record
    //Show Section: Course Outlines and Section: Program Confirmation Form 
    courseOutlineSectionShowHide: function (executionContext) {
        var formContext = executionContext.getFormContext();

        var educationRecognition = formContext.getAttribute("ecer_educationrecognition");
        if (educationRecognition == null) {
            return;
        }
        var educationRecognitionVal = educationRecognition.getValue();
        var generalTab = formContext.ui.tabs.get("tab_general");
        var notRecognized = educationRecognitionVal === 621870001;
        generalTab.sections.get("section_course_outlines").setVisible(notRecognized);
        generalTab.sections.get("section_program_confirmation").setVisible(notRecognized);

    },
    onChangeEducationRecognition: function (executionContext) {
        ECER.Jscripts.Transcript.courseOutlineSectionShowHide(executionContext);
    },
    setDateOnToggle: function (executionContext, toggleFieldName, dateFieldName) {
        // ECER.Jscripts.Application.setDateOnToggle(executionContext, "ecer_characterreferencereceived", "ecer_characterreferencereceiveddate");
        var formContext = executionContext.getFormContext();
        var dateAttribute = formContext.getAttribute(dateFieldName);
        var isTrue = false;
        if (formContext.getAttribute(toggleFieldName) && formContext.getAttribute(toggleFieldName).getValue() != null) {
            isTrue = formContext.getAttribute(toggleFieldName).getValue();
        }
        if (isTrue) {
            var now = new Date();
            var dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateAttribute.setValue(dateOnly);
        }
        else {
            dateAttribute.setValue(null);
        }
    },
    showHideEquivalencyFields: function (executionContext) {

        // ECER-2882
        // When an applications education origin and recognition makes the application an equivalency application. 
        // The correct fields need to be visible.
        // Fields that do not relate to the Equivalency Application and processing path should be hidden to reduce clutter 
        // and increase visibility for the users.
        var formContext = executionContext.getFormContext();
        var educationRecognitionAttributeName = "ecer_educationrecognition";
        var educationRecognitionValue = formContext.getAttribute(educationRecognitionAttributeName).getValue();
        var isNotRecognized = educationRecognitionValue === 621870001; // Not Recognized

        var educationOriginAttributeName = "ecer_educationorigin";
        var educationOriginalValue = formContext.getAttribute(educationOriginAttributeName).getValue();
        var isInsideBC = educationOriginalValue === 621870000; // Inside BC
        var isOutsideBC = educationOriginalValue === 621870001; // Outside BC
        var hideComprehensiveEvaulationReport = (isInsideBC || isOutsideBC);

        var applicationAttributeName = "ecer_applicationid";
        var applicationValue = formContext.getAttribute(applicationAttributeName).getValue();
        if (applicationValue == null) {
            // Need Application Information to determine certain conditions
            return;
        }

        var applicationId = applicationValue[0].id.replace("{", "").replace("}", "");
        var options = "?$select=ecer_type,ecer_iseceassistant";
        Xrm.WebApi.retrieveRecord("ecer_application", applicationId, options).then(
            function success(result) {
                var typeValue = result.ecer_type;
                var isECEAssistant = result.ecer_iseceassistant;
                var isNew = typeValue === 621870000;
                var show = isNew && isNotRecognized;

                // Completeness Review
                crm_Utility.showHide(executionContext, show && !isECEAssistant, "ecer_programconfirmationformreceived");
                crm_Utility.showHide(executionContext, show && !isECEAssistant, "ecer_programconfirmationformreceiveddate");
                crm_Utility.showHide(executionContext, show && !isECEAssistant, "ecer_programconfirmationreviewed");
                crm_Utility.showHide(executionContext, show && !isECEAssistant, "ecer_ihavemyprogramconfirmationandwillupload");
                crm_Utility.showHide(executionContext, show && !isECEAssistant, "ecer_iseceregistryhasprogramconfirmation");

                crm_Utility.showHide(executionContext, show, "ecer_mytranscriptwillrequireenglishtranslation");

                crm_Utility.showHide(executionContext, show, "ecer_courseoutlinereceived");
                crm_Utility.showHide(executionContext, show, "ecer_courseoutlinereceiveddate");
                crm_Utility.showHide(executionContext, show, "ecer_courseoutlinesreviewed");
                crm_Utility.showHide(executionContext, show, "ecer_ihavemycourseoutlinessyllabiandwillupload");
                crm_Utility.showHide(executionContext, show, "ecer_iseceregistryalreadyhasmycourseoutline");

                crm_Utility.showHide(executionContext, show && !hideComprehensiveEvaulationReport, "ecer_comprehensiveevaluationreportreceived");
                crm_Utility.showHide(executionContext, show && !hideComprehensiveEvaulationReport, "ecer_comprehensiveevaluationreportreceiveddate");
                crm_Utility.showHide(executionContext, show && !hideComprehensiveEvaulationReport, "ecer_cerreviewed");

                crm_Utility.showHide(executionContext, show && !hideComprehensiveEvaulationReport, "ecer_iwishtoapplyforafeewaiver");
                crm_Utility.showHide(executionContext, show && !hideComprehensiveEvaulationReport, "ecer_ihavesubmittedanapplicationtobcits");
                crm_Utility.showHide(executionContext, show && !hideComprehensiveEvaulationReport, "ecer_eceregistryalreadyhasmycomprehensivereport");
            },
            function (error) {
                crm_Utility.showMessage(error.message);
            }
        );
    },
    //ECER-4506
    //When PSIValue= Other, Show ecer_mytranscriptwillrequireenglishtranslation field

    onChangePSI: function (executionContext) {
        ECER.Jscripts.Transcript.shownOnPSIeqOther(executionContext);
    },
    shownOnPSIeqOther: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var PSI = "ecer_postsecondaryinstitutionid";
        var otherPSIValue = '38dda20e-e8ee-ef11-be20-7c1e52871876'; //PSI = Other
        var PSIValue = formContext.getAttribute(PSI).getValue();
        var show = PSIValue === otherPSIValue;
        crm_Utility.showHide(executionContext, show, "ecer_mytranscriptwillrequireenglishtranslation");
    },
}