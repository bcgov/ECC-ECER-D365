// Javascript source code

if (typeof ECER === "undefined") {
    var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {}
}

ECER.Jscripts.PSPReferal= {
    crm_ExecutionContext: null,
    onLoad: function (executionContext) {
        this.crm_ExecutionContext = executionContext;
        this.prefilReferalDetails(executionContext);
        this.prefilProgramProfileDetails(executionContext);
        var formContext = executionContext.getFormContext();
       

        
    },
    prefilProgramProfileDetails: function (executionContext) {
        var executionContext = this.crm_ExecutionContext;     
        var formContext = executionContext.getFormContext();  
        var fetchXmlfilter= "";

        var transcript = formContext.getAttribute("ecer_educationtranscript").getValue();  

        if (transcript && transcript[0] && transcript[0].id){
            var transcriptId = transcript[0].id.replace(/[{}]/g, "");

            Xrm.WebApi.retrieveRecord("ecer_transcript", transcriptId, "?$select=ecer_startdate,ecer_enddate").then(
                function success(result) {
                    var pspInstitution = formContext.getAttribute("ecer_pspinstitution").getValue();
                    if (pspInstitution && pspInstitution[0] && pspInstitution[0].id) {
                        var institutionId = pspInstitution[0].id.replace(/[{}]/g, "");
            
                        var startDate = result.ecer_startdate ? result.ecer_startdate : null;
                        var endDate = result.ecer_enddate ? result.ecer_enddate: null;
 
                    if (!startDate || !endDate) {
                        console.log("Transcript start/end dates are missing.");
                        return;
                    }
            
                        fetchXmlfilter = `
            <filter type="and">
            <condition attribute="ecer_postsecondaryinstitution" operator="eq" value="${institutionId}" />
             <condition attribute="ecer_startdate" operator="ge" value="${startDate}" />
             <condition attribute="ecer_enddate" operator="le" value="${endDate}" />
            </filter>`;

            formContext.getControl("ecer_programprofile").addPreSearch(function () {
                ECER.Jscripts.PSPReferal.addCustomLookupFilter(formContext,fetchXmlfilter);
            });
                             
                    }
                },
                function (error) {
                    console.log(error.message);
                
                }
            );

        }  
        
        



       
    },

    
    prefilReferalDetails: function (executionContext) {
        var executionContext = this.crm_ExecutionContext;
        
        var formContext = executionContext.getFormContext();
        var appId = formContext.getAttribute("ecer_application").getValue();
        if(appId && appId !== null){
            formContext.getAttribute("ecer_educationtranscript").setRequiredLevel("required");
            formContext.getAttribute("ecer_pspinstitution").setRequiredLevel("required");
            formContext.getAttribute("ecer_description").setRequiredLevel("required");
           


        }



    },
    addCustomLookupFilter: function (formContext,fetchXmlfilter) {
        
        formContext.getControl("ecer_programprofile").addCustomFilter(fetchXmlfilter, "ecer_program");      
    },


    onClickPSPReferalButton: function (formContext) {
       
        var appId = formContext.data.entity.getId();
        var aname = formContext.getAttribute("ecer_name").getValue();
        console.log("test"+appId);
      
        var entityName = "ecer_pspreferral";
        var formId = "9cb08d76-9e53-f011-877b-000d3ae89366";

        var pageInput = {
            pageType: "entityrecord",
            entityName: entityName,
            formId: formId,
            data:{
                ecer_application: {
                    id: appId,
                    name:aname,
                    entityType: "ecer_application"
            }
        }

        };

        var navigationOptions = {
            target: 2, 
            width: 800,
            height: 600
        };

        Xrm.Navigation.navigateTo(pageInput, navigationOptions).then(
            function () {

                console.log("Main Form opened successfully.");
              
            },
            function (error) {
                console.log("Error opening main Form: " + error.message);
            }
        );


    },

   
}


