
// This file defines the database schema for the Travel Management application.

using {cuid , managed } from '@sap/cds/common';

namespace travel;

// Entity for storing main travel request information
entity Travel_Requests : managed {
    key travelRequestId : UUID @UUID @generatedValue @(title: 'Travel RequestId'); // Unique ID for each travel request
    key empId           : String(10)  @(title: 'Employee Id'); // Employee ID from SuccessFactors
        requestType     : String(255) @(title: 'Request Type'); //3 types of - Business / Conference / Training
        status          : String(255) @(title: 'Status'); // Status: Pending, Approved, Rejected
        totalPerDeim    : Integer     @(
            title          : 'Total Per Deim',
            readOnly       : true,
            sap.ui.readOnly: true
        );
        Remarks         : String(255) @(title: 'Comments');
}

// Entity for storing trip details related to a travel request
entity Trip_Items :  managed{
key tripId              : UUID                              @(title: 'Trip Id'); // Unique ID for each trip
    travelRequestId     : Association to Travel_Requests    @(title: 'Travel RequestId'); // Link to TravelRequest
    fromDate            : Date                              @(title: 'From Date'); // Start date of the trip
    visaRequired        : Boolean                           @(title: 'Visa Required');
    flightRequired      : Boolean                           @(title: 'Flight Required');
    fromCountry         : String(255)                       @(title: 'From Country');
    fromCity            : String(255)                       @(title: 'From City'); //Free text fieldd
    toDate              : Date                              @(title: 'To Date'); // End date of the trip
    toCountry           : String(255)                       @(title: 'To Country');
    toCity              : String(255)                       @(title: 'To City');
    PerDeim             : Integer                           @(title: 'PerDeim');
    remarks             : String(255)                       @(title: 'Remarks'); // Remarks about the trip
   
}

entity Attachments : cuid, managed {
    travelRequestId : Association to Travel_Requests @(title: 'travelRequestId');
    content         : LargeBinary                    @Core.MediaType: mediaType;
    fileName        : String                         @(title: 'Attachment Name');
    size            : Integer                        @(title: 'Attachment Type');

    @Core.IsMediaType: true
    mediaType       : String                         @(title: 'Attachment Type');
    url             : String                         @(title: 'Attachment Url');
}

// Entity for storing workflow logs related to travel approvals
entity WorkflowLogs {
key logId               : UUID;                             // Unique ID for each log entry
    travelRequestId     : Association to Travel_Requests;   // Link to TravelRequest
    step                : String(50);                       // Workflow step name
    status              : String(20);                       // Status: Pending, Approved, Rejected
    approver            : String(100);                      // Name of the approver
    actionDate          : Timestamp;                        // Date of the action
    comments            : String(255);                      // Comments by the approver
}

