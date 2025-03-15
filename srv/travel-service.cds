// This file defines the OData service for the Travel Management application.

using travel from '../db/schema';
using {DEST_SF_DATA} from './external/DEST_SF_DATA';


service TravelService {
    entity Travel_Requests as projection on travel.Travel_Requests;
    entity Trip_Items      as projection on travel.Trip_Items;
    entity Attachments     as projection on travel.Attachments;

    entity WorkflowLogs    as projection on travel.WorkflowLogs;
    function getToken()                        returns String;
    function getRepositoryInfo()               returns String;
    action   createFolder(folderName : String) returns String;

    action   uploadAttachments(payload : {
        files : many FileInfo
    })                                         returns many DMSResponse;

    // Creating an User Entity to fetch employee data from SuccessFactors
    entity User            as
        select from DEST_SF_DATA.User {
            empId,
            username,
            lastName,
            jobTitle,
            department,
            division,
            email,
            title,
            userId,
            custom02,
            custom03,
            custom04,
            custom09,
            custom10,
            custom11,
            custom14
        };


    type FileInfo {
        fileName              : String;
        mediaType             : String;
        size                  : Integer;
        content               : String;
        travelRequestId_empId : String;
    }

    type DMSResponse {
        fileName : String;
        ObjectId : String;
        status   : String;
        error    : String;
    }

}
