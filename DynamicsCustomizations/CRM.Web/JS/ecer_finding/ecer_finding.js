// Javascript source code

window.ECER = window.ECER || {};
ECER.Jscripts = ECER.Jscripts || {};

ECER.Jscripts.Finding = {
  crm_ExecutionContext: null,
  onLoad: function (executionContext) {
    ECER.Jscripts.Finding.showInvestigationBanner(
      executionContext,
      "ecer_investigation_id"
    );
  },


  showInvestigationBanner: function (executionContext, investigationLookup) {
    var formContext = executionContext.getFormContext();
    if (!formContext || !investigationLookup) return;

    var BANNER_ID = "INV_BANNER";

    function setBanner(clientId, registrantName) {
      if (!clientId && !registrantName)
        return formContext.ui.clearFormNotification(BANNER_ID);
      var msg =
        "Investigation - Client ID : " +
        (clientId || "(blank)") +
        ", Investigation - Registrant Name : " +
        (registrantName || "(blank)");
      formContext.ui.setFormNotification(msg, "WARNING", BANNER_ID);
    }

    function fetchInvestigation(investigationId) {
      return Xrm.WebApi.retrieveRecord(
        "ecer_investigation",
        investigationId,
        "?$select=ecer_clientid,_ecer_applicant_value"
      );
    }

    function tryOnForm() {
      var v = formContext.getAttribute(investigationLookup)?.getValue();
      return v && v[0] && v[0].id ? v[0].id.replace(/[{}]/g, "") : null;
    }

    function tryFromRow() {
      var rowId = formContext.data.entity.getId();
      if (!rowId) return Promise.resolve(null);
      var select = "?$select=_" + investigationLookup + "_value";
      return Xrm.WebApi.retrieveRecord(
        formContext.data.entity.getEntityName(),
        rowId.replace(/[{}]/g, ""),
        select
      ).then((r) => {
        var parentId = r["_" + investigationLookup + "_value"];
        return parentId ? parentId.replace(/[{}]/g, "") : null;
      });
    }

    var invId = tryOnForm();
    (invId ? Promise.resolve(invId) : tryFromRow())
      .then(function (investigationId) {
        if (!investigationId) return null;
        return fetchInvestigation(investigationId);
      })
      .then(function (result) {
        if (!result) {
          setBanner(null, null);
          return;
        }
        var clientId = result.ecer_clientid;
        var registrantName =
          result[
            "_ecer_applicant_value@OData.Community.Display.V1.FormattedValue"
          ];
        setBanner(clientId, registrantName);
      })
      .catch(function () {
        formContext.ui.clearFormNotification(BANNER_ID);
      });
  },
};
