const cds = require('@sap/cds')
const axios = require('axios'); // Axios for making HTTP requests
const cmis = require("cmis");
const { v4: uuidv4 } = require('uuid');
const { Readable , PassThrough }  = require("stream");
const {  executeHttpRequest } = require('@sap-cloud-sdk/connectivity');
require('dotenv').config();

    //   const VCAP_SERVICES = JSON.parse(process.env.VCAP_SERVICES)
    //   const sdmCredentials = VCAP_SERVICES.sdm[0].credentials;c

    //Connection Handler for SF Destination Configured in BTP destination
      async function ConnectToSF(req){
          const travelBackend = await cds.connect.to('DEST_SF_DATA');
          const tx = travelBackend.tx(req);
          const employeeUserId = "22002398"; // this empId comes from workzone
          const employeeDetails = await tx.run(
              SELECT.from('User') 
              .where({ userId: employeeUserId })
          );
          return employeeDetails;
      }


    //   async function ConnectToSF(req) {
    //     try {
    //       // 1️⃣ Connect to the destination
    //       const travelBackend = await cds.connect.to('DEST_SF_DATA');
    //       const tx = travelBackend.tx(req); // Pass user context for JWT
      
    //       const employeeUserId = "22002398";
    //       const payload = {}; // Add payload if required
      
    //       // 2️⃣ Prepare headers with authorization
    //       let headers = {
    //         "Content-Type": "application/json",
    //         "Authorization": cds.context?.headers?.authorization || req?.headers?.authorization
    //       };
      
    //       // 3️⃣ Use tx.send to perform the GET request with query parameters
    //       const response = await tx.send({
    //         method: "GET",
    //         path: `/odata/v2/User`, // Verify the entity set name from metadata
    //         query: { $filter: `userId eq '${employeeUserId}'` },
    //         headers: headers
    //       });
      
    //       // 4️⃣ Return the employee details
    //       return response;
      
    //     } catch (err) {
    //       console.error('❌ Error fetching employee details:', err);
    //       req.error(500, 'Failed to fetch employee details.');
    //     }
    // }

      //Workflow token
      async function getAuthTokenForWF() {
        // const tokenUrl = 'https://btp-apps-test.authentication.in30.hana.ondemand.com/oauth/token'; 
        // const clientId = 'sb-e84f2650-7698-4be1-9f2a-b4638496e62c!b13371|xsuaa!b6621'; 
        // const clientSecret = 'fb81cfa8-2c10-4dd1-9648-4098ff461ef7$0lzUiq808WieDtFehk4egOFECQSqVu5LZ-jhnFnCNpM='; 
        const tokenUrl = process.env.WF_TOKEN_URL; 
        const clientId = process.env.WF_CLIENT_ID; 
        const clientSecret = process.env.WF_CLIENT_SECRETE; 
        const body = new URLSearchParams();
        body.append('grant_type', 'client_credentials');
        body.append('client_id', clientId);
        body.append('client_secret', clientSecret);
        try {
          const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
          });
      
          if (response.ok) {
            const data = await response.json();
            return data.access_token; 
          } else {
            console.error('Failed to fetch auth token:', await response.text());
            throw new Error('Could not retrieve auth token');
          }
        } catch (error) {
          console.error('Error fetching auth token:', error.message);
          throw error;
        }
        
      }


module.exports = {
    ConnectToSF,
    getAuthTokenForWF

}