/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
const cds = require('@sap/cds');
const axios = require('axios'); // Axios for making HTTP requests
const cmis = require("cmis")
const { getDestination, executeHttpRequest } = require('@sap-cloud-sdk/connectivity');
const {ConnectToSF ,getAuthTokenForWF} = require('./libs/travelAppHandlers')
const { getRepositoryInfo, ReadDMSDocuments,createFolder,uploadToDMS, getToken , getFolderTree } = require('./libs/dmsHandlers');


module.exports = cds.service.impl(async function() {
    const { Travel_Requests, Trip_Items,Attachements, WorkflowLogs ,User} = this.entities;
  
      this.on('CREATE', 'Travel_Requests', async (req) => {
          const payload = req.data; 
          // console.log("req.data " , req.data)
            if (!payload.travelRequestId || !payload.empId) {
              req.error(400, "Missing required fields.");
              return;
          }
          try {
              await INSERT.into(Travel_Requests).entries(payload);
            const insertedRecord = await SELECT.one.from(Travel_Requests).where({ travelRequestId: payload.travelRequestId }); 
            await triggerWorkflow(insertedRecord);
            return insertedRecord ;
        } catch (error) {
            req.error(500, `Failed to create travel request: ${error.message}`);
        }
      });
  
      this.on('CREATE','Trip_Items', async (req) => {
          const payload = req.data;
          try {
              await INSERT.into(Trip_Items).entries(payload);
              req.reply({
                statusCode: 201,
                message: "Your Travel request has been successfully submitted",
            });
          } catch (error) {
              console.error("Error inserting trip item:", error);
              req.reject(500, "Internal Server Error");
          }
      });
      
      //Handler to filling the URL column in the Tablec
      this.before("CREATE", 'Attachments', req => {
        req.data.url = `/odata/v2/travel/Attachments(${req.data.ID})/content`
      })

      //Get the Bearer Token for the DMS
      this.on('getToken',  async (req) => {
        try {
          const token = await getToken();
          return { token }; 
        } catch (error) {
          req.error(500, error.message);
        }
      })
      
      this.on("getFolderTree",getFolderTree)

      //Fetch the EmployeeData from External API
      this.on('READ', User, ConnectToSF);
      // this.on("READ", "Documents" ,ReadDMSDocuments); 
      this.on('getRepositoryInfo', getRepositoryInfo);
      this.on("createFolder", createFolder);
      this.on("uploadAttachments" ,uploadToDMS);
      
    

      //Trigger an WorkForm
      async function triggerWorkflow(travelRecord) {
            // const destination = await cds.connect.to("DEST_WorkFlow");
            // if (!destination) {
            //     throw new Error('Destination not found. Please check your BTP destination configuration.');
            // }
            const url = 'https://spa-api-gateway-bpi-in-prod.cfapps.in30.hana.ondemand.com/workflow/rest/v1/workflow-instances';
            const token = await getAuthTokenForWF();
            const body = JSON.stringify({
              "definitionId": "in30.btp-apps-test.businesstravelworkflow1.travelRequestHandle",
              // "definitionId": "in30.btp-apps-test.businesstravelworkflowcopy.travelRequestHandle",
              "context": {
                travelrequestid: travelRecord.travelRequestId,
                empid : travelRecord.empId,
                date: travelRecord.createdAt
              }
            });
      
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: body,
          });
      
          if (response.ok) {
            console.log('Workflow triggered successfully');
          } else {
            console.error('Failed to trigger workflow:', await response.text());
          }
        } catch (error) {
          console.error('Error triggering workflow:', error.message);
        }
    }

})
