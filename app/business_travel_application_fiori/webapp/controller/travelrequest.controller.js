// @ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/ui/core/library",
    "sap/m/MessageBox",
    "sap/ui/core/UIComponent",
    'sap/m/DraftIndicator',
    "sap/m/plugins/UploadSetwithTable",
	"sap/ui/core/Fragment",
	"sap/m/MessageToast",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/library",
	"sap/m/Text",
	"sap/ui/core/Item",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Element",
    "sap/m/upload/UploadSet",
    "sap/ui/core/routing/History",
    "sap/ui/core/EventBus"


], function(Controller,EventBus,UIComponent,History, UploadSetwithTable, MessageBox, Fragment, MessageToast, Dialog, Button, mobileLibrary, Text, coreLibrary, Item, Filter, FilterOperator, Element, JSONModel) {
    "use strict";
    let addAnotherCityFormCount = 0;
    return Controller.extend("travelapp.businesstravelapplicationfiori.controller.travelrequest", {
        onInit: function () {

            // var oModel = new sap.ui.model.odata.v2.ODataModel("/odata/v2/travel/");
            var oModel = this.getOwnerComponent().getModel();
            console.log("oModel ", oModel);
            this.getView().setModel(oModel);
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute('RouteTotravelrequest').attachPatternMatched(this._onRouteMatched, this);

            // var currentRouter =  oRouter.getRoute('RouteTotravelrequest');
            // currentRouter.attachPatternMatched(function(oEvent) {
            //     var oArgs = oEvent.getParameters().arguments;
            //     var userId = oArgs.userId;
            //   }, this);

            //TravelType
            this.getView().setModel(new sap.ui.model.json.JSONModel({
                tripData: [{
                    TripType: "",
                    TripTypeOptions: [
                        { key: "BUSINESS", text: "BUSINESS" },
                        { key: "CONFERENCE", text: "CONFERENCE" },
                        { key: "TRAINING", text: "TRAINING" }
                    ]
                }]
            }), "tripTypeModel");

            //Visa and Transport
            this.getView().setModel(new sap.ui.model.json.JSONModel({
                tripItem: [
                    {
                        TransportRequired: "",
                        TransportRequiredOptions: [
                            { key: "true", text: "YES" },
                            { key: "false", text: "NO" }
                        ]
                    },
                    {
                        VisaRequired: "",
                        VisaRequiredOptions: [
                            { key: "true", text: "YES" },
                            { key: "false", text: "NO" }
                        ]
                    }
                ]
            }), "tripItemJsonModel");

            //Initialize the EventBus
            this.eventBus = new EventBus();

                // calling methods
                this.onReadEmpData()
                this.formDateRestrict();
                // this._filterAttachmentsByEmpId();
                this.formCount = 1;
                
                var employeeData;


        },

        //List of Methods

        // _onRouteMatched
        // onReadEmpData
        // handleSaveBtnPress
        // onCancelRequest
        // formDateRestrict
        // onAddCity



        _onRouteMatched: function(oEvent) {
            var empID = oEvent.getParameter('arguments').userId;
            if(empID){
                this.onReadEmpData();
            }

        },


        //Reading the User Data from SF
           onReadEmpData: function(){
            var oDataModel = this.getOwnerComponent().getModel();
            var oJSONModel = new sap.ui.model.json.JSONModel();
            this.getView().setBusy(true);
            oDataModel.read("/User",{
                success: function(res){
                    if (res?.results && res?.results.length > 0) {
                        oJSONModel.setProperty("/EmployeeData", res.results);
                        this.getView().setModel(oJSONModel, "EmployeeJsonModel");
                    } else {
                        console.error("No data found for Employee.");
                    }
                    this.getView().setBusy(false);
                }.bind(this),
                error: function(err){
                }.bind(this)
            })
         },

         onResetAllForms: function (){
            if(!this.oDailog){
                this.loadFragment({
                    name: "travelapp.businesstravelapplicationfiori.fragments.busy",
                    controller:this			
                }).then(function(odailog){
                    this.oDailog = odailog;
                    this.oDailog.open(); 
                    setTimeout(() => {
                        window.location.reload();
                    });  
                }.bind(this))
                }else{
                    this.oDailog.open();
                }

        },
    

         //Reading Attachment based in Employee ID
        //  _filterAttachmentsByEmpId: async function () {
        //     const oModel = this.getOwnerComponent().getModel();
        //     if (!empId) {
        //         console.error("Employee ID not available.");
        //         return;
        //     }
        //     const aFilters = [
        //         new sap.ui.model.Filter("travelRequestId_empId", sap.ui.model.FilterOperator.EQ, this.empId)
        //     ];
        //     oModel.read("/Attachments", {
        //         filters: aFilters,
        //         success: function (oData) {
        //             const oTable = this.getView().byId("table-uploadSet");
        //             const oJSONModel = new sap.ui.model.json.JSONModel();
        //             oJSONModel.setData(oData.results);
        //             console.log("oData.results ", oData.results)
        //             oTable.setModel(oJSONModel);
        //             oTable.bindItems({
        //                 path: "/",
        //                 template: oTable.getBindingInfo("items").template 
        //             });
        //         }.bind(this),
        //         error: function (oError) {
        //             console.error("Failed to fetch filtered Attachments:", oError);
        //         }
        //     });
        // },
        
        onNavBack : function() {
			const oHistory = sap.ui.core.routing.History.getInstance();
			const sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				const oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("Routedashboard", {}, true);

			}
		},

        //Cancel the request and revert back to dashboard page
        onCancelRequest : async function() {
			const oRouter = this.getOwnerComponent().getRouter();
			sap.m.MessageBox.warning(
				"Are you sure you want to cancel this request? Any unsaved changes will be lost if you proceed."  ,
				{
					icon: sap.m.MessageBox.Icon.WARNING,
					actions: ["Yes", sap.m.MessageBox.Action.CANCEL],
					emphasizedAction: "Yes",
					styleClass: "sapMUSTRemovePopoverContainer",
					initialFocus: sap.m.MessageBox.Action.CANCEL,
					onClose: function(sAction) {
						if (sAction === "Yes") {
							setTimeout(() => {
								window.location.reload();
							});
						}
						oRouter.navTo("Routedashboard", {}, true);
					}
				})
		},

        //Restriction for DataPicker
        formDateRestrict : function(){
            var oMinDate = new Date();
            var oMaxDate = new Date(oMinDate);
            oMaxDate.setDate(oMaxDate.getDate() + 90);

            ["FromDate_Id", "ToDate_Id"].forEach(function(id) {
                var oDatePicker = this.byId(id);
                if (oDatePicker) {
                    oDatePicker.setMinDate(oMinDate);
                    oDatePicker.setMaxDate(oMaxDate);
                } else {
                    console.error(id + " not found.");
                }
            }.bind(this));
         },

        //Add city Form 
        onAddCity: function () {
          var oView = this.getView();

          // Validate Travel Header Form
          const tripHeaderForm = oView.byId("tripHeaderForm");
          const isTripHeaderFormValid =  this.validateForm(tripHeaderForm);

          // Validate Travel items Form
          const tripItemsForm = oView.byId("tripItemForm");
          const isTripItemsFormValid =  this.validateForm(tripItemsForm);

          if (!isTripHeaderFormValid || !isTripItemsFormValid ) {
              sap.m.MessageBox.error("Please fill all required fields before submitting.");
              return;
          }

            if (!this.formList) {
                this.formList = [];
            }
            this.addAnotherCityFormCount = this.formList.length + 1;
            console.log("this.addAnotherCityFormCount ", this.addAnotherCityFormCount);
            if (this.formList.length >= 2) {
                sap.m.MessageBox.warning("Only Three Destinations are allowed");
                return;
            }
            var OriginalForm = this.getView().byId("tripItemForm");
            var oFormContainer = OriginalForm.getParent();
            var oTitle = new sap.m.Title({
                text: "Add-On Destination - " + (this.formList.length + 1),
                level: sap.ui.core.TitleLevel.H4
            });
            var oClonedForm = OriginalForm.clone();
            // console.log("oClonedForm ", oClonedForm);
            var oDeleteButton = new sap.m.Button({
                text: "Delete",
                type: sap.m.ButtonType.Reject,
                press: function (oEvent) {
                    var index = this.formList.findIndex(item => item.form === oClonedForm);
                    if (index !== -1) {
                        oFormContainer.removeContent(this.formList[index].title);
                        oFormContainer.removeContent(this.formList[index].form);
                        oFormContainer.removeContent(this.formList[index].button);
                        this.formList.splice(index, 1);
                        this._updateDestinationNumbers();
                    }
                }.bind(this)
            });

            this._clearFormFields(oClonedForm);
            this.formList.push({ title: oTitle, form: oClonedForm, button: oDeleteButton});
            oFormContainer.addContent(oTitle);
            oFormContainer.addContent(oClonedForm);
            oFormContainer.addContent(oDeleteButton);
        },
        
        _updateDestinationNumbers: function () {
            this.formList.forEach((item, index) => {
                item.title.setText("Add-On Destination - " + (index + 1));
            });
        },
        

        _clearFormFields: function (oForm) {
            var clearFields = function (oControl) {
                if (oControl.setValue) {
                    oControl.setValue("");
                }
                if (oControl.isA && oControl.isA("sap.m.ComboBox")) {
                    oControl.setSelectedKey(""); 
                }
                if (oControl.getContent && typeof oControl.getContent === "function") {
                    oControl.getContent().forEach(clearFields);
                }
                if (oControl.getItems && typeof oControl.getItems === "function") {
                    oControl.getItems().forEach(clearFields);
                }
            };
            clearFields(oForm);
        },




        testSubmit: function () {
            
            var getControlValues = function (oControl, values) {
                if (oControl.isA("sap.m.Input")) {
                    values[oControl.getId().split("--").pop().split("-")[0]] = oControl.getValue();
                }
                if (oControl.isA("sap.m.ComboBox")) {
                    values[oControl.getId().split("--").pop().split("-")[0]] = oControl.getSelectedKey();
                }
                if (oControl.isA("sap.m.ComboBox")) {
                    values[oControl.getId().split("--").pop().split("-")[0]] = oControl.getValue();
                }
                if (oControl.isA("sap.m.DatePicker")) {
                    values[oControl.getId().split("--").pop().split("-")[0]] = oControl.getDateValue();
                }
                if (oControl.isA("sap.m.TextArea")) {
                    values[oControl.getId().split("--").pop().split("-")[0]] = oControl.getValue();
                }
                if (oControl.getContent) {
                    oControl.getContent().forEach(child => getControlValues(child, values));
                }
            };
            
            this.formList.forEach(function(item, index) {
                var formValues = {};
                item.form.getContent().forEach(element => getControlValues(element, formValues));
                console.log("Destination", index + 1, "Values:", formValues);
            });
        },


        //Attachements Control
        onPluginActivated: function(oEvent) {
			this.oUploadPluginInstance = oEvent.getParameter("oPlugin");
		},

        onSearch: function (oEvent) {
			// add filter for search
			const aFilters = [];
			const sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				const filter = new Filter("fileName", FilterOperator.Contains, sQuery);
				aFilters.push(filter);
			}

			// update list binding
			const oTable = this.byId("table-uploadSet");
			const oBinding = oTable.getBinding("items");
			oBinding.filter(aFilters, "Application");
		},
        onDownloadFiles: function(oEvent) {
			const oContexts = this.byId("table-uploadSet").getSelectedContexts();
			if (oContexts && oContexts.length) {
				oContexts.forEach((oContext) => this.oUploadPluginInstance.download(oContext, true));
			}
		},
        onSelectionChange: function(oEvent) {
                const oTable = oEvent.getSource();
                const aSelectedItems = oTable?.getSelectedContexts();
                const oDownloadBtn = this.byId("downloadSelectedButton");
                const oRemoveDocumentBtn = this.byId("removeDocumentButton");

                if (aSelectedItems.length > 0) {
                    oDownloadBtn.setEnabled(true);
                } else {
                    oDownloadBtn.setEnabled(false);
                }
         },
         onRemoveButtonPress: function(oEvent) {
			var oTable = this.byId("table-uploadSet");
			const aContexts = oTable.getSelectedContexts();
			this.removeItem(aContexts[0]);
		},

        onRemoveHandler: function(oEvent) {
            var oItem = oEvent.getSource().getParent();
            var oBindingContext = oItem.getBindingContext("fileMetadata");
            var oModel = this.getView().getModel("fileMetadata");
            var files = oModel.getProperty("/files");
            var index = oBindingContext.getPath().split("/").pop();  
            var fileName = files[index].fileName;
        
            sap.m.MessageBox.warning(
                `Are you sure you want to remove the document "${fileName}"?`, 
                {
                    icon: sap.m.MessageBox.Icon.WARNING,
                    actions: ["Remove", sap.m.MessageBox.Action.CANCEL],
                    emphasizedAction: "Remove",
                    styleClass: "sapMUSTRemovePopoverContainer",
                    initialFocus: sap.m.MessageBox.Action.CANCEL,
                    onClose: function(sAction) {
                        if (sAction !== "Remove") {
                            return;
                        }
                        files.splice(index, 1);
                        oModel.refresh(true);
                        var oTable = this.byId("table-uploadSet");
                        oTable.removeSelections();  
                        sap.m.MessageToast.show("Document removed successfully.");
                    }.bind(this)
                }
            );
        },

        openPreview: function(oEvent) {
            var oSource = oEvent.getSource().getParent();
            var oTable = this.byId("table-uploadSet");
            var oContext = oTable.getBinding("items");
			if (oContext && this.oUploadPluginInstance) {
				this.oUploadPluginInstance.openFilePreview(oContext);
			}
		},

        onBeforeUploadStarts : function(oEvent){
            oEvent.preventDefault();
            var oModel = this.getOwnerComponent().getModel();
            var oUploadSet = this.byId("table-uploadSet");
            var item = oEvent.getParameter("item");
            item.setUploadState("Ready");
            var fileSize = item.getFileObject().size;
            var maxFileSize = 6 * 1024 * 1024;
            // Check file size
            if (fileSize > maxFileSize) {
                sap.m.MessageToast.show("File size must not exceed 6 MB.");
                return;
            }
            var currentFiles = oUploadSet.getItems();
            if (currentFiles.length >= 6) {
                sap.m.MessageToast.show("You can upload a maximum of 6 files Per Travel Request.");
                return;
            }
            this._addToFileMetadata(item);
        },

        _addToFileMetadata: function (item) {
            var oModel = this.getOwnerComponent().getModel();
            const empData = this.getView().getModel("EmployeeJsonModel")?.getProperty("/EmployeeData");
            var oFileMetadata = this.getView().getModel("fileMetadata");
            if (!oFileMetadata) {
                oFileMetadata = new sap.ui.model.json.JSONModel({ files: [] });
                this.getView().setModel(oFileMetadata, "fileMetadata");
            }
            var reader = new FileReader();
            reader.onload = function (event) {
                var base64Content = event.target.result.split(",")[1]; // Remove the Base64 prefix
                var fileInfo = {
                    fileName: item.getFileName(),
                    mediaType: item.getMediaType() || "application/octet-stream",
                    size: item.getFileObject().size,
                    content: base64Content,
                    travelRequestId_empId: empData[0]?.empId,
                    oItem: item
                };
                var files = oFileMetadata.getProperty("/files");
                files.push(fileInfo);
                // console.log("files ", files);
                oFileMetadata.refresh(true);

                // var totalSize = files.reduce((sum, file) => sum + file.size, 0);
                // var totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
                // console.log(`Total file size: ${totalSizeMB} MB`);
            };
            // Read the file as Base64
            reader.readAsDataURL(item.getFileObject());
        },

        onUploadCompleted : function(oEvent) {
          oEvent.preventDefault();
        //   console.log("oEventon UC " , oEvent)
        },
        //Attachement Contols End

     
        
        //Validating Form Fields
        validateForm: function (form) {
            let isValid = true; 
            const content = form.getContent(); 
            content.forEach(function (element) {
                if (element instanceof sap.m.Input || 
                    element instanceof sap.m.ComboBox || 
                    element instanceof sap.m.DatePicker) {
        
                    if (element.getRequired && element.getRequired()) { 
                        const value = element.getValue ? element.getValue() : element.getSelectedKey();
                        if (!value) {
                            element.setValueState(sap.ui.core.ValueState.Error);
                            isValid = false; 
                        } else {
                            element.setValueState(sap.ui.core.ValueState.None);
                        }
                    }
                }
            });
            return isValid;
        },
        

        // Generate UUID
        generateUUID: function () {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
                const r = (Math.random() * 16) | 0,
                    v = c === "x" ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
        },


        //create folder in DMS using userId
        onCreateFolder: async function() {
           const oData=  this.getView().getModel("EmployeeJsonModel")?.getProperty("/EmployeeData")
            if (oData) console.log("Employee data:", oData);
            var folderName = "22002398";
            if(!folderName){
                sap.m.MessageToast.show("Failed to Fetch FolderName");
                return
            }
            try{
                var oModel = this.getOwnerComponent().getModel();
                await oModel.callFunction("/createFolder", {
                    method: "POST",
                    urlParameters: {folderName: folderName}
                });
                sap.m.MessageToast.show("Folder Created");
            }catch(error){
                console.error(error)
            }
        },

        createTravelRequest: async function (oPayload) {
            const oModel = await this.getOwnerComponent().getModel();
            return new Promise((resolve, reject) => {
                oModel.create("/Travel_Requests", oPayload, {
                    success: function (oData) {
                        console.log("Travel_Requests ", oData);
                        const travelRequestId = oData.travelRequestId; 
                        resolve(travelRequestId);
                    },
                    error: function (oError) {
                        sap.m.MessageBox.error(
                            "Failed to create travel request. Please try again."
                        );
                        reject(oError);
                    },
                });
            });
        },

        //  Saving to TripItems Table
        saveToTripItems: async function (payload) {
            const oModel = await this.getOwnerComponent().getModel();
            return new Promise((resolve, reject) => {
                oModel.create("/Trip_Items", payload, {
                    success: function (oData) {
                        if (oData.statusCode === 201) {
                            sap.m.MessageToast.show(oData.message);
                            resolve(oData);
                        } else {
                            sap.m.MessageBox.error("Unexpected response from the server.");
                            reject(oData);
                        }
                    },
                    error: function (oError) {
                        // console.error("Error saving Trip Details:", oError);
                        sap.m.MessageBox.error("Failed to submit the Request. Please try again.", {
                            onClose: function () {
                                const busyDialog = new sap.m.BusyDialog({
                                });
                                busyDialog.open();
                                setTimeout(function () {
                                    location.reload();
                                    busyDialog.close(); 
                                }, 2000); 
                            },
                        });
                        reject(oError);
                    },
                });
            });
        },

        _submitAttachments: function (travelRequestId) {
            var oFileMetadata = this.getView().getModel("fileMetadata");
            if (!oFileMetadata) {
                sap.m.MessageToast.show("No files to upload.");
                return;
            }
        
            var files = oFileMetadata.getProperty("/files");
            if (files.length === 0) {
                sap.m.MessageToast.show("No files to upload.");
                return;
            }
        
            var oModel = this.getOwnerComponent().getModel();
        
            // Function to send a single file
            function uploadFile(file) {
                var payload = {
                    travelRequestId_travelRequestId: travelRequestId,
                    fileName: file.fileName,
                    content: file.content,
                    size: file.size,
                    mediaType: file.mediaType,
                    travelRequestId_empId: file.travelRequestId_empId,
                    url: " "
                };
                return new Promise((resolve, reject) => {
                    oModel.create("/Attachments", payload, {
                        success: function (response) {
                            resolve(response);
                        },
                        error: function (error) {
                            console.error("Error uploading file: ", file.fileName, error);
                            reject(error);
                        }
                    });
                });
            }
            // Upload files sequentially to avoid payload size issue
            (async () => {
                try {
                    for (const file of files) {
                        await uploadFile(file);
                    }
                    console.log("Uploaded!!")
                    oFileMetadata.setProperty("/files", []);
                } catch (error) {
                    sap.m.MessageToast.show("Some files failed to upload.");
                    console.error("Upload error:", error);
                }
            })();
        },

    
        //OnSubmit
        // onSubmit : async function() {
        //     const oRouter = await this.getOwnerComponent().getRouter();
        //     var OriginalForm = this.byId("tripItemForm");
        //     var oFormContainer = OriginalForm.getParent();
        //     const empData=  this.getView().getModel("EmployeeJsonModel")?.getProperty("/EmployeeData");
        //     const empId = empData[0].userId;
        //     var oView = this.getView();
        //     if(this.formCount > 1){
        //         var aForms = oView.byId("tripItemForm").getParent().getContent();
        //         console.log("aForms ",aForms);
        //         var aFormData = [];
              
        //     }else{
        //         try {
        //             // // Validate Travel Header Form
        //             const tripHeaderForm = oView.byId("tripHeaderForm");
        //             const isTripHeaderFormValid =  this.validateForm(tripHeaderForm);
    
        //             // Validate Travel items Form
        //             const tripItemsForm = oView.byId("tripItemForm");
        //             const isTripItemsFormValid =  this.validateForm(tripItemsForm);
        //             if (!isTripHeaderFormValid || !isTripItemsFormValid) {
        //                 sap.m.MessageBox.error("Please fill all required fields before submitting.");
        //                 return;
        //             }
        //             const tripheaderModel = oView.getModel("tripTypeModel");
        //             const tripitemModel = oView.getModel("tripItemJsonModel");
        //             var oTripTypeCB = this.getView().byId("travel_typeId_CB");
        //             var TripTypeSelectedKey = oTripTypeCB.getSelectedKey();
    
        //             const NewtravelRequestId = this.generateUUID();
        //             const travelHeaderPayload = {
        //                 travelRequestId : NewtravelRequestId,
        //                 empId : empId,
        //                 // createdAt:new Date().toISOString(),
        //                 createdBy: empId,
        //                 // modifiedAt:new Date().toISOString(),
        //                 modifiedBy: empId,
        //                 requestType: TripTypeSelectedKey,
        //                 status: "Pending",
        //                 totalPerDeim: 500,
        //                 Remarks: "Request Submitted"
        //             };
                    
        //             // console.log("travelHeaderPayload ", travelHeaderPayload);
        //             const CreatedtravelRequestId = await this.createTravelRequest(travelHeaderPayload);
        //                 const travelItemPayload = {
        //                     tripId: this.generateUUID(),
        //                     travelRequestId_travelRequestId: CreatedtravelRequestId,  
        //                     travelRequestId_empId : empId,              
        //                     createdBy: empId,
        //                     modifiedBy: empId,
        //                     fromDate: oView.byId("FromDate_Id").getDateValue(),
        //                     fromCountry: oView.byId("From_Country").getValue(),
        //                     fromCity: oView.byId("FromCity").getValue(),
        //                     visaRequired: oView.byId("VisaRequired").getSelectedKey(),
        //                     flightRequired: oView.byId("flightRequired").getSelectedKey(),
        //                     toDate: oView.byId("ToDate_Id").getDateValue(),
        //                     toCountry: oView.byId("To_country").getValue(),
        //                     toCity: oView.byId("ToCity").getValue(),
        //                     PerDeim: oView.byId("perDeim_ip").getValue(),
        //                     remarks: oView.byId("comments").getValue()
    
        //                 }
        //                 if (CreatedtravelRequestId) {
        //                     this.saveToTripItems(travelItemPayload);
                        
        //                     // Upload attachments first
        //                     await this._submitAttachments(CreatedtravelRequestId);
                        
        //                     // THEN show success message
        //                     sap.m.MessageBox.show("Travel request submitted successfully!");
                        
        //                     this.getView().setBusy(true);
        //                     setTimeout(() => {
        //                         window.location.reload();
        //                     });
        //                     oRouter.navTo("Routedashboard", {}, true);
        //                 } else {
        //                     sap.m.MessageBox.error("Internal Server Error. Please try again later.");
        //                 }

        //         }catch (error){
        //             console.error(error);
        //             sap.m.MessageBox.error("An error occurred while submitting the request!!!.");
        //         }
        //     }

        // },


        //OnSubmit
        onSubmit : async function() {
            console.log("test ", testSubmit());
            const oRouter = await this.getOwnerComponent().getRouter();
            var OriginalForm = this.byId("tripItemForm");
            var oFormContainer = OriginalForm.getParent();
            const empData=  this.getView().getModel("EmployeeJsonModel")?.getProperty("/EmployeeData");
            const empId = empData[0].userId;
            var oView = this.getView();
            if(this.addAnotherCityFormCount <=0){
                    // // Validate Travel Header Form
                    const tripHeaderForm = oView.byId("tripHeaderForm");
                    const isTripHeaderFormValid =  this.validateForm(tripHeaderForm);

                    // Validate Travel items Form
                    const tripItemsForm = oView.byId("tripItemForm");
                    const isTripItemsFormValid =  this.validateForm(tripItemsForm);
                    if (!isTripHeaderFormValid || !isTripItemsFormValid) {
                        sap.m.MessageBox.error("Please fill all required fields before submitting.");
                        return;
                    }
                    const tripheaderModel = oView.getModel("tripTypeModel");
                    const tripitemModel = oView.getModel("tripItemJsonModel");
                    var oTripTypeCB = this.getView().byId("travel_typeId_CB");
                    var TripTypeSelectedKey = oTripTypeCB.getSelectedKey();

                    const NewtravelRequestId = this.generateUUID();
                    const travelHeaderPayload = {
                        travelRequestId : NewtravelRequestId,
                        empId : empId,
                        // createdAt:new Date().toISOString(),
                        createdBy: empId,
                        // modifiedAt:new Date().toISOString(),
                        modifiedBy: empId,
                        requestType: TripTypeSelectedKey,
                        status: "Pending",
                        totalPerDeim: 500,
                        Remarks: "Request Submitted"
                    };
                    
                    // console.log("travelHeaderPayload ", travelHeaderPayload);
                    const CreatedtravelRequestId = await this.createTravelRequest(travelHeaderPayload);
                        const travelItemPayload = {
                            tripId: this.generateUUID(),
                            travelRequestId_travelRequestId: CreatedtravelRequestId,  
                            travelRequestId_empId : empId,              
                            createdBy: empId,
                            modifiedBy: empId,
                            fromDate: oView.byId("FromDate_Id").getDateValue(),
                            fromCountry: oView.byId("From_Country").getValue(),
                            fromCity: oView.byId("FromCity").getValue(),
                            visaRequired: oView.byId("VisaRequired").getSelectedKey(),
                            flightRequired: oView.byId("flightRequired").getSelectedKey(),
                            toDate: oView.byId("ToDate_Id").getDateValue(),
                            toCountry: oView.byId("To_country").getValue(),
                            toCity: oView.byId("ToCity").getValue(),
                            PerDeim: oView.byId("perDeim_ip").getValue(),
                            remarks: oView.byId("comments").getValue()

                        }
                        if (CreatedtravelRequestId) {
                            this.saveToTripItems(travelItemPayload);
                        
                            // Upload attachments 
                            await this._submitAttachments(CreatedtravelRequestId);
                            sap.m.MessageBox.show("Travel request submitted successfully!");
                            this.getView().setBusy(true);
                            setTimeout(() => {
                                window.location.reload();
                            });
                            oRouter.navTo("Routedashboard", {}, true);
                        } else {
                            sap.m.MessageBox.error("Internal Server Error. Please try again later.");
                        }

            }else{
                try {
                     // Validate Travel Header Form
                    const tripHeaderForm = oView.byId("tripHeaderForm");
                    const isTripHeaderFormValid =  this.validateForm(tripHeaderForm);
    
                    // Validate Travel items Form
                    const tripItemsForm = oView.byId("tripItemForm");
                    const isTripItemsFormValid =  this.validateForm(tripItemsForm);

                    if (!isTripHeaderFormValid || !isTripItemsFormValid ) {
                        sap.m.MessageBox.error("Please fill all required fields before submitting.");
                        return;
                    }
                    const tripheaderModel = oView.getModel("tripTypeModel");
                    const tripitemModel = oView.getModel("tripItemJsonModel");
                    var oTripTypeCB = this.getView().byId("travel_typeId_CB");
                    var TripTypeSelectedKey = oTripTypeCB.getSelectedKey();
    
                    const NewtravelRequestId = this.generateUUID();
                    const travelHeaderPayload = {
                        travelRequestId : NewtravelRequestId,
                        empId : empId,
                        // createdAt:new Date().toISOString(),
                        createdBy: empId,
                        // modifiedAt:new Date().toISOString(),
                        modifiedBy: empId,
                        requestType: TripTypeSelectedKey,
                        status: "Pending",
                        totalPerDeim: 500,
                        Remarks: "Request Submitted"
                    };
                    
                    // console.log("travelHeaderPayload ", travelHeaderPayload);
                    const CreatedtravelRequestId = await this.createTravelRequest(travelHeaderPayload);

                   const travelItemPayload = []

                    if(this.addAnotherCityFormCount > 0){

                        const travelItem1 = {
                            tripId: this.generateUUID(),
                            travelRequestId_travelRequestId: CreatedtravelRequestId,  
                            travelRequestId_empId : empId,              
                            // createdBy: empId,
                            // modifiedBy: empId,
                            fromDate: oView.byId("FromDate_Id").getDateValue(),
                            fromCountry: oView.byId("From_Country").getValue(),
                            fromCity: oView.byId("FromCity").getValue(),
                            visaRequired: oView.byId("VisaRequired").getSelectedKey(),
                            flightRequired: oView.byId("flightRequired").getSelectedKey(),
                            toDate: oView.byId("ToDate_Id").getDateValue(),
                            toCountry: oView.byId("To_country").getValue(),
                            toCity: oView.byId("ToCity").getValue(),
                            PerDeim: oView.byId("perDeim_ip").getValue(),
                            remarks: oView.byId("comments").getValue()
    
                        }
                        travelItemPayload.push(travelItem1)

                        var getControlValues = function (oControl, values) {
                            if (oControl.isA("sap.m.Input")) {
                                values[oControl.getId().split("--").pop().split("-")[0]] = oControl.getValue();
                            }
                            if (oControl.isA("sap.m.ComboBox")) {
                                values[oControl.getId().split("--").pop().split("-")[0]] = oControl.getSelectedKey();
                            }
                            if (oControl.isA("sap.m.ComboBox")) {
                                values[oControl.getId().split("--").pop().split("-")[0]] = oControl.getValue();
                            }
                            if (oControl.isA("sap.m.DatePicker")) {
                                values[oControl.getId().split("--").pop().split("-")[0]] = oControl.getDateValue();
                            }
                            if (oControl.isA("sap.m.TextArea")) {
                                values[oControl.getId().split("--").pop().split("-")[0]] = oControl.getValue();
                            }
                            if (oControl.getContent) {
                                oControl.getContent().forEach(child => getControlValues(child, values));
                            }
                        };
                        
                        this.formList.forEach(function(item, index) {
                            var formValues = {};
                            item.form.getContent().forEach(element => getControlValues(element, formValues));
                            formValues.tripId = this.generateUUID();
                            formValues.travelRequestId_travelRequestId = CreatedtravelRequestId;
                            formValues.travelRequestId_empId = empId;
                            formValues.fromDate = formValues.FromDate_Id; delete formValues.FromDate_Id;
                            formValues.fromCountry = formValues.From_Country; delete formValues.From_Country;
                            formValues.fromCity = formValues.FromCity; delete formValues.FromCity;
                            formValues.visaRequired = formValues.VisaRequired === "YES"; delete formValues.VisaRequired;
                            formValues.flightRequired = formValues.flightRequired === "YES";
                            formValues.toDate=formValues.ToDate_Id; delete formValues.ToDate_Id;
                            formValues.toCountry=formValues.To_country; delete formValues.To_country;
                            formValues.toCity=formValues.ToCity; delete formValues.ToCity;
                            formValues.PerDeim=formValues.perDeim_ip; delete formValues.perDeim_ip;
                            formValues.remarks=formValues.comments; delete formValues.comments;
                            
                        travelItemPayload.push(formValues)
                        }.bind(this));

                        // console.log("travelItemPayload ", travelItemPayload);
                    }

                       
                        if (CreatedtravelRequestId) {
                            travelItemPayload.forEach((item, index) => {
                                this.saveToTripItems(item) 
                                    .then(() => {
                                        sap.m.MessageBox(`Batch ${index + 1} saved successfully.`);
                                    })
                                    .catch((error) => {
                                        sap.m.MessageBox(`Error saving batch ${index + 1},Please contact the Administrator:`, error );
                                    });
                            });
                        
                            // Upload attachments first
                            await this._submitAttachments(CreatedtravelRequestId);
                        
                            // THEN show success message
                    
                        
                            this.getView().setBusy(true);
                            setTimeout(() => {
                                window.location.reload();
                            });
                            oRouter.navTo("Routedashboard", {}, true);
                        } else {
                            sap.m.MessageBox.error("Internal Server Error. Please try again later.");
                        }

                }catch (error){
                    console.error(error);
                    sap.m.MessageBox.error("An error occurred while submitting the request!!!.");
                }
            }

        }


        //Test
        // onSubmit : async function() {
        //     const oRouter = await this.getOwnerComponent().getRouter();
        //     var OriginalForm = this.byId("tripItemForm");
        //     var oFormContainer = OriginalForm.getParent();
        //     const empData=  this.getView().getModel("EmployeeJsonModel")?.getProperty("/EmployeeData");
        //     const empId = empData[0].userId;
        //     var oView = this.getView();
        //     if(this.addAnotherCityFormCount <=0){
        //             // // Validate Travel Header Form
        //             const tripHeaderForm = oView.byId("tripHeaderForm");
        //             const isTripHeaderFormValid =  this.validateForm(tripHeaderForm);

        //             // Validate Travel items Form
        //             const tripItemsForm = oView.byId("tripItemForm");
        //             const isTripItemsFormValid =  this.validateForm(tripItemsForm);
        //             if (!isTripHeaderFormValid || !isTripItemsFormValid) {
        //                 sap.m.MessageBox.error("Please fill all required fields before submitting.");
        //                 return;
        //             }
        //             const tripheaderModel = oView.getModel("tripTypeModel");
        //             const tripitemModel = oView.getModel("tripItemJsonModel");
        //             var oTripTypeCB = this.getView().byId("travel_typeId_CB");
        //             var TripTypeSelectedKey = oTripTypeCB.getSelectedKey();

        //             const NewtravelRequestId = this.generateUUID();
        //             const travelHeaderPayload = {
        //                 travelRequestId : NewtravelRequestId,
        //                 empId : empId,
        //                 // createdAt:new Date().toISOString(),
        //                 createdBy: empId,
        //                 // modifiedAt:new Date().toISOString(),
        //                 modifiedBy: empId,
        //                 requestType: TripTypeSelectedKey,
        //                 status: "Pending",
        //                 totalPerDeim: 500,
        //                 Remarks: "Request Submitted"
        //             };
                    
        //             // console.log("travelHeaderPayload ", travelHeaderPayload);
        //             const CreatedtravelRequestId = await this.createTravelRequest(travelHeaderPayload);
        //                 const travelItemPayload = {
        //                     tripId: this.generateUUID(),
        //                     travelRequestId_travelRequestId: CreatedtravelRequestId,  
        //                     travelRequestId_empId : empId,              
        //                     createdBy: empId,
        //                     modifiedBy: empId,
        //                     fromDate: oView.byId("FromDate_Id").getDateValue(),
        //                     fromCountry: oView.byId("From_Country").getValue(),
        //                     fromCity: oView.byId("FromCity").getValue(),
        //                     visaRequired: oView.byId("VisaRequired").getSelectedKey(),
        //                     flightRequired: oView.byId("flightRequired").getSelectedKey(),
        //                     toDate: oView.byId("ToDate_Id").getDateValue(),
        //                     toCountry: oView.byId("To_country").getValue(),
        //                     toCity: oView.byId("ToCity").getValue(),
        //                     PerDeim: oView.byId("perDeim_ip").getValue(),
        //                     remarks: oView.byId("comments").getValue()

        //                 }
        //                 if (CreatedtravelRequestId) {
        //                     this.saveToTripItems(travelItemPayload);
                        
        //                     // Upload attachments 
        //                     await this._submitAttachments(CreatedtravelRequestId);
        //                     sap.m.MessageBox.show("Travel request submitted successfully!");
        //                     this.getView().setBusy(true);
        //                     setTimeout(() => {
        //                         window.location.reload();
        //                     });
        //                     oRouter.navTo("Routedashboard", {}, true);
        //                 } else {
        //                     sap.m.MessageBox.error("Internal Server Error. Please try again later.");
        //                 }

        //     }else{
        //         try {
        //           // Validate Travel Header Form
        //           const tripHeaderForm = oView.byId("tripHeaderForm");
        //           const isTripHeaderFormValid =  this.validateForm(tripHeaderForm);
  
        //           // Validate Travel items Form
        //           const tripItemsForm = oView.byId("tripItemForm");
        //           const isTripItemsFormValid =  this.validateForm(tripItemsForm);

        //           if (!isTripHeaderFormValid || !isTripItemsFormValid ) {
        //               sap.m.MessageBox.error("Please fill all required fields before submitting.");
        //               return;
        //           }
        //           const tripheaderModel = oView.getModel("tripTypeModel");
        //           const tripitemModel = oView.getModel("tripItemJsonModel");
        //           var oTripTypeCB = this.getView().byId("travel_typeId_CB");
        //           var TripTypeSelectedKey = oTripTypeCB.getSelectedKey();
  
        //           const NewtravelRequestId = this.generateUUID();
        //           const travelHeaderPayload = {
        //               travelRequestId : NewtravelRequestId,
        //               empId : empId,
        //               // createdAt:new Date().toISOString(),
        //               createdBy: empId,
        //               // modifiedAt:new Date().toISOString(),
        //               modifiedBy: empId,
        //               requestType: TripTypeSelectedKey,
        //               status: "Pending",
        //               totalPerDeim: 500,
        //               Remarks: "Request Submitted"
        //           };
                  
        //           // console.log("travelHeaderPayload ", travelHeaderPayload);
        //           const CreatedtravelRequestId = await this.createTravelRequest(travelHeaderPayload);

        //          const travelItemPayload = []

        //           if(this.addAnotherCityFormCount > 0){

        //               const travelItem1 = {
        //                   tripId: this.generateUUID(),
        //                   travelRequestId_travelRequestId: CreatedtravelRequestId,  
        //                   travelRequestId_empId : empId,              
        //                   // createdBy: empId,
        //                   // modifiedBy: empId,
        //                   fromDate: oView.byId("FromDate_Id").getDateValue(),
        //                   fromCountry: oView.byId("From_Country").getValue(),
        //                   fromCity: oView.byId("FromCity").getValue(),
        //                   visaRequired: oView.byId("VisaRequired").getSelectedKey(),
        //                   flightRequired: oView.byId("flightRequired").getSelectedKey(),
        //                   toDate: oView.byId("ToDate_Id").getDateValue(),
        //                   toCountry: oView.byId("To_country").getValue(),
        //                   toCity: oView.byId("ToCity").getValue(),
        //                   PerDeim: oView.byId("perDeim_ip").getValue(),
        //                   remarks: oView.byId("comments").getValue()
  
        //               }
        //               travelItemPayload.push(travelItem1)

        //               var getControlValues = function (oControl, values) {
        //                   if (oControl.isA("sap.m.Input")) {
        //                       values[oControl.getId().split("--").pop().split("-")[0]] = oControl.getValue();
        //                   }
        //                   if (oControl.isA("sap.m.ComboBox")) {
        //                       values[oControl.getId().split("--").pop().split("-")[0]] = oControl.getSelectedKey();
        //                   }
        //                   if (oControl.isA("sap.m.ComboBox")) {
        //                       values[oControl.getId().split("--").pop().split("-")[0]] = oControl.getValue();
        //                   }
        //                   if (oControl.isA("sap.m.DatePicker")) {
        //                       values[oControl.getId().split("--").pop().split("-")[0]] = oControl.getDateValue();
        //                   }
        //                   if (oControl.isA("sap.m.TextArea")) {
        //                       values[oControl.getId().split("--").pop().split("-")[0]] = oControl.getValue();
        //                   }
        //                   if (oControl.getContent) {
        //                       oControl.getContent().forEach(child => getControlValues(child, values));
        //                   }
        //               };
                      
        //               this.formList.forEach(function(item, index) {
        //                   var formValues = {};
        //                   item.form.getContent().forEach(element => getControlValues(element, formValues));
        //                   formValues.tripId = this.generateUUID();
        //                   formValues.travelRequestId_travelRequestId = CreatedtravelRequestId;
        //                   formValues.travelRequestId_empId = empId;
        //                   formValues.fromDate = formValues.FromDate_Id; delete formValues.FromDate_Id;
        //                   formValues.fromCountry = formValues.From_Country; delete formValues.From_Country;
        //                   formValues.fromCity = formValues.FromCity; delete formValues.FromCity;
        //                   formValues.visaRequired = formValues.VisaRequired === "YES"; delete formValues.VisaRequired;
        //                   formValues.flightRequired = formValues.flightRequired === "YES";
        //                   formValues.toDate=formValues.ToDate_Id; delete formValues.ToDate_Id;
        //                   formValues.toCountry=formValues.To_country; delete formValues.To_country;
        //                   formValues.toCity=formValues.ToCity; delete formValues.ToCity;
        //                   formValues.PerDeim=formValues.perDeim_ip; delete formValues.perDeim_ip;
        //                   formValues.remarks=formValues.comments; delete formValues.comments;
                          
        //               travelItemPayload.push(formValues)
        //               }.bind(this));

        //               // console.log("travelItemPayload ", travelItemPayload);
        //             }

                       
        //                 if (CreatedtravelRequestId) {
        //                     travelItemPayload.forEach((item, index) => {
        //                         this.saveToTripItems(item) 
        //                             .then(() => {
        //                                 sap.m.MessageBox(`Batch ${index + 1} saved successfully.`);
        //                             })
        //                             .catch((error) => {
        //                                 sap.m.MessageBox(`Error saving batch ${index + 1},Please contact the Administrator:`, error );
        //                             });
        //                     });
                        
        //                     // Upload attachments first
        //                     await this._submitAttachments(CreatedtravelRequestId);
                    
                        
        //                     this.getView().setBusy(true);

        //                     sap.m.MessageBox.success(`Your Travel Request (ID: ${CreatedtravelRequestId}) has been successfully submitted.`, {
        //                         onClose: function () {
        //                             oRouter.navTo("Routedashboard", {}, true);
        //                             setTimeout(() => {
        //                                 window.location.reload(); 
        //                             }, 1000); 
        //                         }
        //                     });
        //                 } else {
        //                     sap.m.MessageBox.error("Internal Server Error at 1160. Please contact the Administrator.");
        //                 }

        //         }catch (error){
        //             console.error(error);
        //             sap.m.MessageBox.error("An error occurred while submitting the request!!!.");
        //         }
        //     }

        // }

    })

})
