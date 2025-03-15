const cds = require('@sap/cds')
const axios = require('axios'); // Axios for making HTTP requests
const cmis = require("cmis");
const { v4: uuidv4 } = require('uuid');
const { Readable , PassThrough }  = require("stream");
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');
require('dotenv').config();


      // const VCAP_SERVICES = JSON.parse(process.env.VCAP_SERVICES)
      // const sdmCredentials = VCAP_SERVICES.sdm[0].credentials;
      const sdmCredentials = {
        uaa: {
          clientid: process.env.DMS_CLIENT_ID,
          clientsecret: process.env.DMS_CLIENT_SECRETE,
          url: process.env.DMS_URL,
      }
    }

     
      const  getToken  = async function() {
        return _fetchJwtToken(
          sdmCredentials.uaa.url,
          sdmCredentials.uaa.clientid,
          sdmCredentials.uaa.clientsecret
        )
     };

     const _fetchJwtToken = async function (oauthUrl, oauthClient, oauthSecret) {
          return new Promise((resolve, reject)=>{
              const tokenUrl = oauthUrl + "/oauth/token?grant_type=client_credentials&response_type=token";
    
              const config = {
                  headers: {
                      Authorization:
                          "Basic " +
                          Buffer.from(oauthClient + ":" + oauthSecret).toString("base64"),
                  },
              };
              axios
                  .get(tokenUrl, config)
                  .then((response) =>{
                      resolve(response.data.access_token);
                  })
                  .catch((error) =>{
                      reject(error);
                  });
          })
      };
    
   
    
    //   console.log("sdmCredentials ",sdmCredentials);
    
      const session = new cmis.CmisSession(
          sdmCredentials.url + "browser"
      )
    
  
    //Connection Handler for DMS Destination

    async function getRepositoryInfo(){  
      const cmisService = await cds.connect.to("DEST_DMS");
      const token = await getToken();
      const headers = {
         'Authorization' : `Bearer ${token}`
      };
      return cmisService.send({ method: "GET", path: "browser", headers });
    }


    async function createFolder(req) {
      const repoInfo = await getRepositoryInfo();
      const jwtToken = await getToken();
      const repositoryId = repoInfo[Object.keys(repoInfo)[0]].repositoryId;

      return new Promise((resolve, reject) => {
        if (!req.data.folderName) {
          return req.error("No folderName Provided");
        }
        const folderCreateURL = session.url + "/" + repositoryId + "/root"
        console.log("folderCreateURL ", folderCreateURL);
        const formData = new FormData();
        formData.append("cmisaction", "createFolder");
        formData.append("propertyId[0]", "cmis:objectTypeId");
        formData.append("propertyValue[0]", "cmis:folder");
        formData.append("propertyId[1]", "cmis:name");
        formData.append("propertyValue[1]", req.data.folderName);
        formData.append("succinct", 'true');

        let headers = formData.getHeaders();
        headers["Authorization"] = "Bearer " + jwtToken;

        const config = {
          headers: headers
        }

        axios.post(folderCreateURL, formData, config)
          .then(response => {
            resolve(response.data.succinctProperties["cmis:objectId"])
            console.log("response ", response);
          })
          .catch(error => {
            reject(error)
          })
      })
    };

    

    async function uploadToDMS(req, next) {
        const { payload } = req.data;
        const files = payload.files;
        console.log("Received files:", files);
        if (!payload || !payload.files || !Array.isArray(payload.files) || payload.files.length === 0) {
            req.error(400, "No files provided for upload.");
        }
      
        const access_token = await getToken();
        const repositoryInfo = getRepositoryInfo();
          console.log("req ", req.data);
        if(req.data.content) {

        const db = await cds.connect.to("db");
        const cmisService = await cds.connect.to("DEST_DMS");
        const documentId = req.data.ID;
        const document = await db.run(
        SELECT.one.from("Attachments").where({
            ID: documentId,
          })
        );
        console.log("document " ,document)
        if(!document){
          return req.error("metadata does not exist");
        }
        const stream = new PassThrough();
        const chunks = [];
        stream.on("data", (chunk) => {
          chunks.push(chunk);
        });
        stream.on("end", async () => {
          const contentBuffer = Buffer.concat(chunks);
          //FormData

          const form = new FormData();
          form.append("cmisaction", "createDocument");
          form.append("propertyId[0]", "cmis:objectTypeId");
          form.append("propertyValue[0]", "cmis:document");
          form.append("propertyId[1]",  "cmis:name");
          form.append("succinct",  "true");
          form.append("includeAllowableActions",  "true");
          const CRLF = "\r\n";
          const options = {
            header:
            "--" +
            form.getBoundary() +
            CRLF +
            `Content-Disposition: form-data; name="propertyValue[1]"` +
            CRLF +
            `Content-Type: text/plain;charset=UTF-8` +
            CRLF +
            CRLF,
          };
          form.append("propertyValue[1]",  document.fileName, options);
          const fileOptions = {
            header:
              "--" +
              form.getBoundary() +
              CRLF +
              `Content-Disposition: form-data; name="file"; filename*=UTF-8''${ document.fileName}` +
              CRLF +
              `Content-Type: ${document.mediaType}` +
              CRLF +
              CRLF,
          };
          form.append("file",contentBuffer, fileOptions);
          const repositoryInfo = await getRepositoryInfo();
          console.log("repositoryInfo", repositoryInfo);

          const baseUrl = session.url;
          const uploadUrl =`${baseUrl}/806f4c88-93f9-467c-94e6-3f03b865c5cd/root`
          console.log("uploadUrl " , uploadUrl);
            try {
              const res = await axios.post(uploadUrl, form, {
                  headers: {
                      ...form.getHeaders(),
                      Authorization: `Bearer ${access_token}`,
                  },
                  timeout: 60000,
              });
              console.log("Upload successful",res.data );
          } catch (error) {
              console.error("Error uploading document: ", error.response ? error.response.data : error.message);
          }
        });
        req.data.content.pipe(stream);
      }

    }

    async function getFolderTree() {
      try {
        // Step 1: Fetch the repositories
        const jwtToken = await getToken();
        const repoInfo = await getRepositoryInfo();
        const repositoryId = repoInfo[Object.keys(repoInfo)[0]].repositoryId;
        
        console.log("Repository ID:", repositoryId);
        const folderTreeURL = ` ${session.url}/${repositoryId}/root`;
        const headers = {
            Authorization: `Bearer ${jwtToken}`,
            Accept: "application/json",
        };    
        const response = await axios.get(folderTreeURL, { headers });
        const folderTree = response.data;
        console.log("response:", response);
        console.log("Folder Tree:", folderTree);

        return folderTree;
    } catch (error) {
        console.error("Error fetching folder tree:", error.message);
        throw error;
    }
    };



      // async function ReadDMSDocuments(req) {
      //   const CmisService = await cds.connect.to("DEST_DMS");
      //   const documentId = "";
      //      const url =`/${encodeURIComponent(
      //       "MyFile"
      //      )}?cmisselector=content`;
      //      const headers = {
      //           'Authorization' : `Bearer ${getToken()}`
      //      };
      //      console.log("header " , headers);
      //      const getResponse = await axios({
      //           method: 'GET',
      //           url: sdmCredentials.uaa.url,
      //           responseType : "arraybuffer",
      //      })
      //   }

module.exports = {
        getRepositoryInfo,
        createFolder,
        getToken,
        uploadToDMS,
        getFolderTree
    }