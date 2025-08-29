if (typeof ECER === "undefined") {
  var ECER = {};
}
if (typeof ECER.Jscripts === "undefined") {
  ECER.Jscripts = {};
}

ECER.Jscripts.Interview = {
  onLoad: function (executionContext) {
    ECER.Jscripts.Interview.populateFromInvolvedPerson(executionContext);
    ECER.Jscripts.Interview.showInvestigationBanner(executionContext, {
      investigationLookup: "ecer_investigation",
    });
  },
  onSave: function (executionContext) {
    this.onChangeDescription(executionContext);
  },
  onChangeDescription: function (executionContext) {
    // check if details is dirty
    let formContext = executionContext.getFormContext();

    let details = formContext.getAttribute("ecer_description");

    if (details === null || !details.getIsDirty() || !DOMParser) {
      return;
    }

    if (details.getValue() != null) {
      //ecer_detailstext is has string data from HTML in ecer_details
      var parsedString = new DOMParser().parseFromString(
        details.getValue(),
        "text/html"
      );

      formContext
        .getAttribute("ecer_descriptionplaintext")
        ?.setValue(parsedString?.body?.textContent);
    } else {
      formContext.getAttribute("ecer_descriptionplaintext")?.setValue(null);
    }
  },
  populateFromInvolvedPerson: function (executionContext) {
    var lookupAttrName = "ecer_investigationplanninginvolve";
    var destNameAttr = "ecer_name";
    var destRoleAttr = "ecer_role";
    var destEmailAttr = "ecer_email";
    var destPhoneAttr = "ecer_phonenumber";

    var sourceTable = "ecer_investigationplanninginvolvedperson";

    var selectCols =
      "?$select=ecer_firstname,ecer_lastname,ecer_role,emailaddress,ecer_phonenumber";

    var formContext = executionContext.getFormContext();
    var lookupAttr = formContext.getAttribute(lookupAttrName);
    if (lookupAttr === null) {
      console.log("Lookup field not on form");
      return;
    }

    var lookupValue = lookupAttr.getValue();
    if (lookupValue === null) {
      console.log("Lookup empty – nothing to copy");
      return;
    }

    var lookupId = lookupValue[0].id.replace(/[{}]/g, "").toLowerCase();

    Xrm.WebApi.retrieveRecord(sourceTable, lookupId, selectCols).then(
      function success(record) {
        var current = formContext.getAttribute(lookupAttrName).getValue();
        if (
          !current ||
          current[0].id.replace(/[{}]/g, "").toLowerCase() !== lookupId
        ) {
          return;
        }

        var first = record.ecer_firstname || "";
        var last = record.ecer_lastname || "";
        var full = (first + " " + last).trim();

        if (full) formContext.getAttribute(destNameAttr).setValue(full);
        if (record.ecer_role !== undefined)
          formContext.getAttribute(destRoleAttr).setValue(record.ecer_role);
        if (record.emailaddress !== undefined)
          formContext.getAttribute(destEmailAttr).setValue(record.emailaddress);
        if (record.ecer_phonenumber !== undefined)
          formContext
            .getAttribute(destPhoneAttr)
            .setValue(record.ecer_phonenumber);
      },
      function (error) {
        console.log("Interview populate error: " + error.message);
        Xrm.Utility.alertDialog("Couldn’t pull details from Involved Person.");
      }
    );
  },
  showInvestigationBanner: function (executionContext, configJson) {
    "use strict";
    try {
      var formContext =
        executionContext &&
        typeof executionContext.getFormContext === "function"
          ? executionContext.getFormContext()
          : executionContext;
      if (!formContext || !formContext.data || !formContext.data.entity) return;

      var BANNER_ID = "INV_BANNER";

      var defaults = {
        invEntityLogicalName: "ecer_investigation",
        clientIdAttr: "ecer_clientid",
        registrantLookupAttr: "ecer_applicant",
        investigationLookup: null,
        investigationLookupCandidates: [
          "ecer_investigationid",
          "ecer_investigation",
          "ecer_investigation_lookup",
        ],
        debug: false,
      };

      function extend(t, s) {
        if (!s) return t;
        for (var k in s) {
          if (Object.prototype.hasOwnProperty.call(s, k)) t[k] = s[k];
        }
        return t;
      }

      var cfg = {};
      extend(cfg, defaults);
      if (configJson) {
        if (typeof configJson === "string") {
          try {
            extend(cfg, JSON.parse(configJson));
          } catch (e) {}
        } else if (typeof configJson === "object") {
          extend(cfg, configJson);
        }
      }
      function log() {
        if (cfg.debug && window.console)
          try {
            console.log.apply(console, arguments);
          } catch (e) {}
      }

      function clearBanner() {
        try {
          formContext.ui.clearFormNotification(BANNER_ID);
        } catch (e) {}
      }
      function setBanner(clientId, registrantName) {
        if (!clientId && !registrantName) {
          clearBanner();
          return;
        }
        var msg =
          "Investigation - Client ID : " +
          (clientId || "(blank)") +
          ", Investigation - Registrant Name : " +
          (registrantName || "(blank)");
        try {
          formContext.ui.setFormNotification(msg, "WARNING", BANNER_ID);
        } catch (e) {}
      }

      function getAttr(name) {
        return formContext.getAttribute(name);
      }
      function getVal(name) {
        var a = getAttr(name);
        return a ? a.getValue() : null;
      }
      function getCurrentId() {
        var id = formContext.data.entity.getId();
        return id ? id.replace(/[{}]/g, "") : null;
      }

      function fetchInvestigation(invId, done, fail) {
        if (!invId) {
          fail && fail();
          return;
        }
        var q =
          "?$select=" +
          cfg.clientIdAttr +
          ",_" +
          cfg.registrantLookupAttr +
          "_value";
        Xrm.WebApi.retrieveRecord(cfg.invEntityLogicalName, invId, q).then(
          function (r) {
            var clientId = r[cfg.clientIdAttr];
            var registrantName =
              r[
                "_" +
                  cfg.registrantLookupAttr +
                  "_value@OData.Community.Display.V1.FormattedValue"
              ];
            if (!registrantName) {
              try {
                var regOnForm = getVal(cfg.registrantLookupAttr);
                registrantName =
                  regOnForm && regOnForm[0] ? regOnForm[0].name : null;
              } catch (e) {}
            }
            done && done(clientId, registrantName);
          },
          function (err) {
            log("INV banner retrieve error:", err);
            fail && fail(err);
          }
        );
      }

      function resolveInvestigationLookupName() {
        if (cfg.investigationLookup) return cfg.investigationLookup;
        for (var i = 0; i < cfg.investigationLookupCandidates.length; i++) {
          var cand = cfg.investigationLookupCandidates[i];
          if (getAttr(cand)) return cand;
        }
        var attrs = formContext.data.entity.attributes.get();
        for (var j = 0; j < attrs.length; j++) {
          try {
            var a = attrs[j];
            if (a && a.getAttributeType && a.getAttributeType() === "lookup") {
              var n = a.getName ? a.getName() : a._name;
              if (n && /investig/i.test(n)) return n;
            }
          } catch (e) {}
        }
        return null;
      }

      var entityName = formContext.data.entity.getEntityName();

      // INVESTIGATION form
      if (entityName === cfg.invEntityLogicalName) {
        // try direct read; if not present, fall back to Web API
        var clientIdVal = getVal(cfg.clientIdAttr);
        var regVal = getVal(cfg.registrantLookupAttr);
        if (clientIdVal || (regVal && regVal[0])) {
          var regNameInline = regVal && regVal[0] ? regVal[0].name : null;
          setBanner(clientIdVal, regNameInline);
        } else {
          fetchInvestigation(getCurrentId(), setBanner, clearBanner);
        }

        // keep updated if fields exist on the form
        var a1 = getAttr(cfg.clientIdAttr);
        if (a1)
          a1.addOnChange(function () {
            var v = getVal(cfg.clientIdAttr);
            var r = getVal(cfg.registrantLookupAttr);
            var n = r && r[0] ? r[0].name : null;
            setBanner(v, n);
          });
        var a2 = getAttr(cfg.registrantLookupAttr);
        if (a2)
          a2.addOnChange(function () {
            var v = getVal(cfg.clientIdAttr);
            var r = getVal(cfg.registrantLookupAttr);
            var n = r && r[0] ? r[0].name : null;
            setBanner(v, n);
          });
        return;
      }

      var invLookupName = resolveInvestigationLookupName();
      log("INV banner lookup resolved:", invLookupName);
      if (!invLookupName) {
        clearBanner();
        return;
      }

      function refreshFromParent() {
        var ref = getVal(invLookupName);
        if (!ref || !ref[0]) {
          clearBanner();
          return;
        }
        var invId = (ref[0].id || "").replace(/[{}]/g, "");
        fetchInvestigation(invId, setBanner, clearBanner);
      }

      refreshFromParent();
      var invAttr = getAttr(invLookupName);
      if (invAttr) invAttr.addOnChange(refreshFromParent);
    } catch (err) {
      if (window.console && console.warn)
        console.warn("INV banner error:", err);
    }
  },
};
