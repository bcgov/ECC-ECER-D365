
if (typeof ECER === "undefined") {
    var ECER = {}
}

if (typeof ECER.Jscripts === "undefined") {
    ECER.Jscripts = {}
}

ECER.Jscripts.Campus= {
    crm_ExecutionContext: null,
    onLoad: function (executionContext) {
        
      
    },
    //ECER-5157: populate address from PSI
    setCampusAddress: function (executionContext) {
        var formContext = executionContext.getFormContext();
        var  sameaddressaspsiattribute =formContext.getAttribute("ecer_addresssameaspsi");
        var  sameaddressaspsi= sameaddressaspsiattribute.getValue();


        if( sameaddressaspsiattribute && sameaddressaspsi)
        {
           var psi = formContext.getAttribute("ecer_postsecondaryinstitute").getValue("ecer_postsecondaryinstitute");
           var psiid = psi[0].id.replace(/[{}]/g, "");
           if(psi !== null){

            Xrm.WebApi.retrieveRecord("ecer_postsecondaryinstitute", psiid).then(
                function success(result) {
                    var street1 = result.ecer_street1 ? result.ecer_street1 : null;
                    var street2 = result.ecer_street2 ? result.ecer_street2: null;
                    var street3 = result.ecer_street3 ? result.ecer_street3: null;
                    var city = result.ecer_city ? result.ecer_city: null;
                    var province = result._ecer_provinceid_value ? crm_Utility.generateLookupObject("ecer_province", result["_ecer_provinceid_value"], result["_ecer_provinceid_value@OData.Community.Display.V1.FormattedValue"]): null;
                    var country = result._ecer_countryid_value ? crm_Utility.generateLookupObject("ecer_country", result["_ecer_countryid_value"], result["_ecer_countryid_value@OData.Community.Display.V1.FormattedValue"]): null;
                    var postalcode = result.ecer_zippostalcode ? result.ecer_zippostalcode: null;

                    formContext.getAttribute("ecer_street1").setValue(street1);
                    formContext.getAttribute("ecer_street2").setValue(street2);
                    formContext.getAttribute("ecer_street3").setValue(street3);
                    formContext.getAttribute("ecer_city").setValue(city);
                    formContext.getAttribute("ecer_province").setValue(province);
                    formContext.getAttribute("ecer_country").setValue(country);
                    formContext.getAttribute("ecer_postalcode").setValue(postalcode);

                   
                },
                function (error) {
                    console.log(error.message);
                
                }
            );

           

           }else{
            console.log("empty psi");
           }
          


        }
    
    


    }
    
    
   
}


