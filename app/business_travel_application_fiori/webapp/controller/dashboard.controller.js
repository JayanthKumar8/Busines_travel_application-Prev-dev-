sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("travelapp.businesstravelapplicationfiori.controller.dashboard", {
        onInit() {
            //Get contol references
            this._oSmartFilterBar = this.getView().byId("idsmartFilterBar");
            this._oSFBCombox = this.getView().byId("SFBcomboBox");
            this.onReadEmpData();
        },
       
        onTravelTypeChange : function(oEvent){
                var oSource = oEvent.getSource();
                oSource.data("hasValue", oSource.getSelectedKeys().length>0);
        },


        //Custom Filter for Travel Type
        onBeforRebindTable: function(oEvent){
            var mBindingParams = oEvent.getParameter("bindingParams"),
            aSelectedKeys = this._oSFBCombox.getSelectedKeys();
            if(aSelectedKeys.length > 0){
                var aFilters = aSelectedKeys.map(function (sKey){
                    return new Filter("requestType", FilterOperator.EQ, sKey);
                }),
                oNewFilter = new Filter({
                    filters: aFilters,
                    and: false
                });
                mBindingParams.filters.push(oNewFilter);
            }
        },

        
        onReadEmpData: function(){
            var oDataModel = this.getOwnerComponent().getModel();
            var oJSONModel = new sap.ui.model.json.JSONModel();
            this.getView().setBusy(true);
            oDataModel.read("/User",{
                success: function(res){
                    // console.log("res.results ", res.results[0]);
                    oJSONModel.setProperty("/EmployeeData",res.results);
                    this.getView().setModel(oJSONModel,"EmployeeJsonModel");
                    this.onReadTravelRequestData();
                    this.getView().setBusy(false);
                }.bind(this),
                error: function(err){                   
                }.bind(this)
            })
         },

        onReadTravelRequestData :async function() {
            var oEmployeeJsonModel = this.getView().getModel("EmployeeJsonModel");
            var employeeData = oEmployeeJsonModel ? oEmployeeJsonModel.getProperty("/EmployeeData") : [];
            var loggedInUserId = await employeeData.length > 0 ? employeeData[0].userId : "";
            var oModel = this.getOwnerComponent().getModel();
            var oJSONModel = new sap.ui.model.json.JSONModel();
            oModel.read("/Travel_Requests" ,{
                filters: [new sap.ui.model.Filter("empId", sap.ui.model.FilterOperator.EQ, loggedInUserId)],
                success: function(res){
                    oJSONModel.setData({travelData:res.results});
                    this.getView().setModel(oJSONModel,"travelRequestDataModel");
                }.bind(this),
                error: function(err){                   
                }.bind(this)
            })
        },

        
     
        onClickRow : function(oEvent){
           var selectedRow = oEvent.mParameters.listItem
           var sPath = selectedRow.getBindingContext().getPath();
            if(!this.oDailog){
                this.loadFragment({
                    name: "travelapp.businesstravelapplicationfiori.fragments.details",
                    controller: this
                }).then(function(odailog){
                    this.oDailog = odailog;
                    // @ts-ignore
                    this._bindDialog(sPath);
                    this.oDailog.open();                
                }.bind(this))
            }else{
                this.oDailog.open();
            }
        },

        _bindDialog: function(sPath) {
            if (this.oDailog) {
                this.oDailog.bindElement({
                    path: sPath
                });
            }
        },

        handleCloseDailog: function(){
            this.oDailog.close();
        },


        travelrequest: function() {
            var oRouter = this.getOwnerComponent().getRouter();
            var oEmployeeJsonModel = this.getView().getModel("EmployeeJsonModel");
            var employeeData = oEmployeeJsonModel ? oEmployeeJsonModel.getProperty("/EmployeeData") : [];
            var UserId = employeeData.length > 0 ? employeeData[0].userId : "";
            oRouter.navTo("RouteTotravelrequest", {
                userId: UserId,

            });
        },

    });
});