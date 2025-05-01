using CRM.Plugins.ecer_course;
using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static System.Net.Mime.MediaTypeNames;

namespace CRM.Plugins.ecer_authentication
{
    public class PostAuthenticationCreateUpdate : PluginBase
    {
        public PostAuthenticationCreateUpdate(string unsecure, string secure) : base(typeof(PostAuthenticationCreateUpdate))
        { }
      
        public ITracingService tracingService;
        protected override void ExecuteDataversePlugin(ILocalPluginContext localPluginContext)
        {
            // This plugin is executed after the authentication entity is created or updated.

            IPluginExecutionContext context = localPluginContext.PluginExecutionContext;
            // Using the admin service to ensure that the plugin can run in all context
            IOrganizationService service = localPluginContext.OrganizationServiceAdmin;
            tracingService = localPluginContext.TracingService;

            tracingService.Trace("PostAuthenticationCreateUpdate plugin started.");

            Entity target = context.InputParameters["Target"] as Entity;


            if (target == null)
            {
                tracingService.Trace("Target entity is null.");
                return;
            }

            if (target.LogicalName.ToLower() != "ecer_authentication")
            {
                tracingService.Trace("Target entity is not a authentication.");
                return;
            }

            EntityReference customerRef = null;
            if (context.MessageName.ToLower() == "create")
            {
                customerRef = target.GetAttributeValue<EntityReference>("ecer_customerid");
            }
            else if (context.MessageName.ToLower() == "update")
            {
                Entity entityImage = context.PostEntityImages.ContainsKey("PostImage") ? context.PostEntityImages["PostImage"] as Entity : null;
                customerRef = entityImage?.GetAttributeValue<EntityReference>("ecer_customerid");
                
            }
            if (customerRef == null)
            {
                tracingService.Trace("Customer is null.");
                return;
            }

            // Check if it's a Contact
            if (customerRef.LogicalName != "contact")
                return;

            var contactId = customerRef.Id;

            // Retrieve contact to check 'verified' status
            var contact = service.Retrieve("contact", contactId, new ColumnSet("ecer_isverified"));
            if (!contact.Contains("ecer_isverified") || !(bool)contact["ecer_isverified"])
                return;
            
            // Retrieve all authentication records linked to this contact
            var query = new QueryExpression("ecer_authentication")
            {
                ColumnSet = new ColumnSet("ecer_authenticationid", "createdon"),
                Criteria = new FilterExpression
                {
                    Conditions =
            {
                new ConditionExpression("ecer_customerid", ConditionOperator.Equal, contactId),
                new ConditionExpression("statecode", ConditionOperator.Equal, 0) // Active records
            }
                },
                Orders = { new OrderExpression("createdon",OrderType.Descending) } // Descending
            };

            var results = service.RetrieveMultiple(query).Entities;

            if (results.Count <= 1)
                return;

            // Deactivate all except the latest
            tracingService.Trace("count" + results.Count);
            foreach (var record in results.Skip(1))
            {
                var deactivateRequest = new SetStateRequest
                {
                    EntityMoniker = new EntityReference("ecer_authentication", record.Id),
                    State = new OptionSetValue(1), // Inactive
                    Status = new OptionSetValue(2)
                };
                service.Execute(deactivateRequest);
                
            }
            tracingService.Trace("PostAuthenticationCreateUpdate plugin completed.....");





        }
    }
}
