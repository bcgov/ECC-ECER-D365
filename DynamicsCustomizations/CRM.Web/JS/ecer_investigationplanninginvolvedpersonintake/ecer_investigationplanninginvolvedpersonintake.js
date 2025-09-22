// Javascript source code

if (typeof ECER === "undefined") {
  var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
  ECER.Jscripts = {};
}

ECER.Jscripts.InvolvedPersonIntake = {
  crm_ExecutionContext: null,
  onLoad: function (executionContext) {
    ECER.Jscripts.InvolvedPersonIntake.showInvestigationBanner(
      executionContext,
      {
        debug: true,
        investigationLookup: "ecer_investigation",
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
