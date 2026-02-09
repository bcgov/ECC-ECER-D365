// JavaScript source code

if (typeof ECER === "undefined") {
  var ECER = {};
}

if (typeof ECER.Jscripts === "undefined") {
  ECER.Jscripts = {};
}

ECER.Jscripts.InvolvedPerson = {
  crm_ExecutionContext: null,
  onLoad: function (executionContext) {
    ECER.Jscripts.InvolvedPerson.showInvestigationBanner(executionContext, {
      investigationLookup: "ecer_investigation",
      debug: true,
    });
  },

  onChangeContact: function (executionContext) {
    let formContext = executionContext.getFormContext();

    let contact = formContext.getAttribute("ecer_contact");

    let mapping = [
      {
        involvedPersonAttribute: "ecer_firstname",
        contactAttribute: "firstname",
      },
      {
        involvedPersonAttribute: "ecer_lastname",
        contactAttribute: "lastname",
      },
      {
        involvedPersonAttribute: "ecer_dateofbirthtext",
        contactAttribute: "birthdate",
        format: "MMMM dd, yyyy",
      },
      {
        involvedPersonAttribute: "ecer_phonenumber",
        contactAttribute: "telephone1",
      },
      {
        involvedPersonAttribute: "emailaddress",
        contactAttribute: "emailaddress1",
      },
    ];

    if (contact != null && contact.getValue() != null) {
      let contactId = contact.getValue()[0].id;

      Xrm.WebApi.retrieveRecord(
        "contact",
        contactId,
        "?$select=firstname,lastname,birthdate,emailaddress1,telephone1"
      ).then(
        function (result) {
          mapping.forEach(function (map) {
            let contactAttribute = map.contactAttribute;
            let involvedPersonAttribute = map.involvedPersonAttribute;

            if (result.hasOwnProperty(contactAttribute)) {
              let val = result[contactAttribute];
              if (map.format && val != null) {
                let dt = new Date(val);
                val = dt.format(map.format);
              }

              localSetValue(involvedPersonAttribute, val);
            } else {
              localSetValue(involvedPersonAttribute, null);
            }
          });
        },
        function (error) {
          console.log(error.message);
        }
      );
    } else {
      mapping.forEach(function (map) {
        localSetValue(map.involvedPersonAttribute, null);
      });
    }

    function localSetValue(attribute, value) {
      formContext.getAttribute(attribute)?.setValue(value);
    }
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
        investigationLookup: null, // e.g. "ecer_investigation" or "ecer_investigationid"
        investigationLookupCandidates: [
          "ecer_investigation",
          "ecer_investigationid",
          "ecer_investigation_lookup",
        ],
        debug: false,
        retryDelayMs: 300,
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

      function getAttr(n) {
        return formContext.getAttribute(n);
      }
      function getVal(n) {
        var a = getAttr(n);
        return a ? a.getValue() : null;
      }
      function getCurrentId() {
        var id = formContext.data.entity.getId();
        return id ? id.replace(/[{}]/g, "") : null;
      }
      function getEntityName() {
        return formContext.data.entity.getEntityName();
      }

      // Fetch parent Investigation’s data
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
            // fallback: try on-form lookup value if annotation missing
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

      // Get the Investigation lookup name and whether it’s on the form
      function resolveInvestigationLookup() {
        var name = cfg.investigationLookup || null;
        if (!name) {
          for (var i = 0; i < cfg.investigationLookupCandidates.length; i++) {
            var cand = cfg.investigationLookupCandidates[i];
            if (getAttr(cand)) {
              name = cand;
              break;
            }
          }
        }
        var presentOnForm = !!(name && getAttr(name));
        return { name: name, presentOnForm: presentOnForm };
      }

      // Try to get the parent Investigation ID (on-form first, then Web API)
      function getParentInvestigationId(invMeta, done, fail) {
        if (!invMeta.name) {
          fail && fail();
          return;
        }

        if (invMeta.presentOnForm) {
          var ref = getVal(invMeta.name);
          if (ref && ref[0] && ref[0].id) {
            var id = ref[0].id.replace(/[{}]/g, "");
            log("INV id from on-form lookup:", id);
            done && done(id);
            return;
          }
          log("INV lookup on form but empty at onLoad.");
        }

        // Fallback: read the child record’s _lookup_value
        var childId = getCurrentId();
        if (!childId) {
          fail && fail();
          return;
        }
        var select = "?$select=_" + invMeta.name + "_value";
        Xrm.WebApi.retrieveRecord(getEntityName(), childId, select).then(
          function (r) {
            var parentId = r["_" + invMeta.name + "_value"];
            if (parentId) {
              var id = parentId.replace(/[{}]/g, "");
              log("INV id from child Web API:", id);
              done && done(id);
            } else {
              fail && fail();
            }
          },
          function (err) {
            log("Child record retrieve failed:", err);
            fail && fail(err);
          }
        );
      }

      // MAIN
      var entityName = getEntityName();
      if (entityName === cfg.invEntityLogicalName) {
        // We’re on Investigation form itself
        var clientIdVal = getVal(cfg.clientIdAttr);
        var regVal = getVal(cfg.registrantLookupAttr);
        if (clientIdVal || (regVal && regVal[0])) {
          var regNameInline = regVal && regVal[0] ? regVal[0].name : null;
          setBanner(clientIdVal, regNameInline);
        } else {
          fetchInvestigation(getCurrentId(), setBanner, clearBanner);
        }
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

      // Child forms (Involved Person)
      var invMeta = resolveInvestigationLookup();
      log("INV banner lookup meta:", invMeta);

      function paintOnce(orRetry) {
        getParentInvestigationId(
          invMeta,
          function (invId) {
            fetchInvestigation(invId, setBanner, clearBanner);
          },
          function () {
            if (orRetry) {
              log("Retrying once after delay…");
              window.setTimeout(function () {
                paintOnce(false);
              }, cfg.retryDelayMs);
            } else {
              clearBanner();
            }
          }
        );
      }

      // First paint (with one retry allowance)
      paintOnce(true);

      // If the lookup is actually on the form, wire change handler
      if (invMeta.presentOnForm) {
        var invAttr = getAttr(invMeta.name);
        if (invAttr)
          invAttr.addOnChange(function () {
            paintOnce(false);
          });
      }
    } catch (err) {
      if (window.console && console.warn)
        console.warn("INV banner error:", err);
    }
  },
};
