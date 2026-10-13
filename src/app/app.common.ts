export class Static {
    public static menuList = {
        menu: [{
            sr_id: 3, moduleid: "3", modulename: "Export Menus", type: null, baseUrl: 'export',
            data: [
                {
                    menuid: "2", icon: "fa fa-users", menuname: "Master", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        {
                            menuid: "2.1", icon: "fa fa-ship", menuname: "Vessel", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "2.1.1", icon: "fa fa-caret-right", menuname: "Add", routerlink: "/export/vessel/form", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "2.1.2", icon: "fa fa-caret-right", menuname: "Search", routerlink: "/export/vessel/search", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                            ]
                            },
                            {
                            menuid: "2.2", icon: "fa fa-ship", menuname: "Mawb Stock", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "2.2.1", icon: "fa fa-caret-right", menuname: "Add", routerlink: "/export/mawbstock/Add", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "2.2.2", icon: "fa fa-caret-right", menuname: "Search", routerlink: "/export/mawbstock/Search", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                            ]
                        }
                    ]
                },
                {
                    menuid: "3", icon: "fa fa-users", menuname: "Consignment", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        {
                            menuid: "3.1", icon: "fa fa-ship", menuname: "Consignment", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "3.1.1", icon: "fa fa-caret-right", menuname: "Export Master", routerlink: "/export/Consignment/start", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "3.1.2", icon: "fa fa-caret-right", menuname: "Search", routerlink: "/export/Consignment/search", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                            ]
                        },
                        {
                            menuid: "3.2", icon: "fa fa-ticket", menuname: "PSS", routerlink: "/export/Pss/pss", ischild: 'n', parentid: 0, isactive: 1, data: []
                        },
                        {
                            menuid: "3.3", icon: "fa fa-ticket", menuname: "Branch Job Transfer", routerlink: "/export/branch-job-transfer/branch-job-transfer", ischild: 'n', parentid: 0, isactive: 1, data: []
                        },
                        // {
                        //     menuid: "3.4", icon: "fa fa-ticket", menuname: "Miscellaneous Job", routerlink: "/export/job/misc", ischild: 'n', parentid: 0, isactive: 1, data: []
                        // },
                        {
                            menuid: "3.4", icon: "fa fa-ticket", menuname: "MISC", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                               { menuid: "3.4.1", icon: "fa fa-caret-right", menuname: "Add", routerlink: "/export/Job/job/Add", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                               { menuid: "3.4.2", icon: "fa fa-caret-right", menuname: "Search/Edit", routerlink: "/export/Job/job/misc", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                           ] },
                       
                        {
                            menuid: "3.5", icon: "fa fa-ticket", menuname: "Warehouse Job", routerlink: "/export/Job/job/whs", ischild: 'n', parentid: 0, isactive: 1, data: []
                        },
                         {
                            menuid: "3.6", icon: "fa fa-ticket", menuname: "Auto Job ", routerlink: "/export/Consignment/AutoJob", ischild: 'n', parentid: 0, isactive: 1, data: []
                           
                        },
                        //     {
                        //     menuid: "3.7", icon: "fa fa-ticket", menuname: "Auto Job New ", routerlink: "/export/Consignment/AutoJobnew", ischild: 'n', parentid: 0, isactive: 1, data: []
                           
                        // },
                        // {
                        //     menuid: "3.3", icon: "fa fa-ticket", menuname: "Booking", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        //         { menuid: "3.3.1", icon: "fa fa-caret-right", menuname: "Add", routerlink: "/export/Booking/add", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        //         { menuid: "3.3.2", icon: "fa fa-caret-right", menuname: "Search/Edit", routerlink: "/export/Booking/new-order-booking", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        //     ]
                        // }
                    ]
                },
                {
                    menuid: "4", icon: "fa fa-truck", menuname: "Shipment Progress", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        { menuid: "4.1", icon: "fa fa-caret-right", menuname: "Prepaid Frt Approved by Shipper", routerlink: "/export/shipment-progress/Prepaid-freight-apprvd-search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.2", icon: "fa fa-caret-right", menuname: "Shipping Bill Details", routerlink: "/export/shipment-progress/ship-bill-search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.3", icon: "fa fa-caret-right", menuname: "Receipt of cargo", routerlink: "/export/shipment-progress/receipt-cargo-with-job-no-search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.4", icon: "fa fa-caret-right", menuname: "Dimension", routerlink: "/export/shipment-progress/dimension-search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.5", icon: "fa fa-caret-right", menuname: "Approval Received", routerlink: "/export/shipment-progress/approval-received-search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.6", icon: "fa fa-caret-right", menuname: "Carting Sea", routerlink: "/export/shipment-progress/carting-sea", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.7", icon: "fa fa-caret-right", menuname: "Carting Air", routerlink: "/export/shipment-progress/carting-air-search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.8", icon: "fa fa-caret-right", menuname: "Out Of Charge", routerlink: "/export/shipment-progress/out-of-charge-search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.9", icon: "fa fa-caret-right", menuname: "Destination Document", routerlink: "/export/shipment-progress/destination-document-search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.9", icon: "fa fa-caret-right", menuname: "Measurement", routerlink: "/export/shipment-progress/measurement-search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.11", icon: "fa fa-caret-right", menuname: "Pre Alert", routerlink: "/export/shipment-progress/prealert-sent-on-search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.12", icon: "fa fa-caret-right", menuname: "Bl Details", routerlink: "/export/shipment-progress/bl-details-search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.13", icon: "fa fa-caret-right", menuname: "Transfer Sea To Air", routerlink: "/export/shipment-progress/transfer-sea-to-air-search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.14", icon: "fa fa-caret-right", menuname: "Receipt Cargo", routerlink: "/export/shipment-progress/reciept-cargo-provision", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.15", icon: "fa fa-caret-right", menuname: "Scan Docs Sent Date", routerlink: "/export/shipment-progress/scan-doc-sent", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.16", icon: "fa fa-caret-right", menuname: "Pending Shipment", routerlink: "/export/shipment-progress/pending-shipment", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.17", icon: "fa fa-caret-right", menuname: "Container Loading Confirmation", routerlink: "/export/shipment-progress/container-loading-confirmation", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.18", icon: "fa fa-caret-right", menuname: "Job Vessel to vessel Transfer", routerlink: "/export/shipment-progress/vesselTransfer", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        {
                            menuid: "4.19", icon: "fa fa-ship", menuname: "Container", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "4.19.1", icon: "fa fa-caret-right", menuname: "Doc Stuffing", routerlink:   "/export/container/vessel-view", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "4.19.2", icon: "fa fa-caret-right", menuname: "Factory Stuffing", routerlink: "/export/container/containerFS", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "4.19.3", icon: "fa fa-caret-right", menuname: "Factory Stuffing Auto", routerlink: "/export/container/containerFSauto", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "4.19.4", icon: "fa fa-caret-right", menuname: "Factory Stuffing Edit", routerlink: "/export/container/multicontainerFSedit", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "4.19.5", icon: "fa fa-caret-right", menuname: "Delete Container", routerlink: "/export/container/delete", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                               
                            ]
                        },
                       // { menuid: "4.19", icon: "fa fa-caret-right", menuname: "Container", routerlink: "/export/container/vessel-view", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                      //  { menuid: "4.20", icon:"fa fa-caret-right", menuname: "Container Factory Stuffing", routerlink: "/export/container/containerFS", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.21", icon: "fa fa-caret-right", menuname: "Ep-Copy Recvdt", routerlink: "/export/shipment-progress/epcopy", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                    ]
                },
                { menuid: "5", icon: "fa fa-truck", menuname: "Container List", routerlink: "/export/list-container/container", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                {
                    menuid: "6", icon: "fa fa-print", menuname: "Print Document", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        {
                            menuid: "6.1", icon: "fa fa-plane", menuname: "Air", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "6.1.1", icon: "fa fa-caret-right", menuname: "Mawb ", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                    { menuid: "6.1.1.1", icon: "fa fa-caret-right", menuname: "Generate", routerlink: "/export/print-document/air/mawb/number", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                    { menuid: "6.1.1.2", icon: "fa fa-caret-right", menuname: "Search/Print", routerlink: "/export/print-document/air/mawb/search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                ] },
                                { menuid: "6.1.2", icon: "fa fa-caret-right", menuname: "Hawb ", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                    { menuid: "6.1.2.1", icon: "fa fa-caret-right", menuname: "Generate", routerlink: "/export/print-document/air/hawb/number", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                    { menuid: "6.1.2.2", icon: "fa fa-caret-right", menuname: "Search/Print", routerlink: "/export/print-document/air/hawb/search", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                                ] },
                              ]
                          },
                        {
                            menuid: "6.2", icon: "fa fa-ship", menuname: "Sea", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "6.2.1", icon: "fa fa-caret-right", menuname: "House BL", routerlink: "/export/fcr/form", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "6.2.2", icon: "fa fa-caret-right", menuname: "Master BL", routerlink: "/export/print-document/sea/mbl/number", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                               // { menuid: "6.2.2", icon: "fa fa-caret-right", menuname: "Hawb Search/Print", routerlink: "/export/print-document/air/hawb/search", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                            ]
                        },  
                        { menuid: "6.3", icon: "fa fa-caret-right", menuname: "Docket", routerlink: "/export/print-document/docket-search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "6.3", icon: "fa fa-caret-right", menuname: "Annexure", routerlink: "/export/print-document/annexure", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "6.2", icon: "fa fa-caret-right", menuname: "Prepare Prealert", routerlink: "/export/print-documents/prealert/prepare", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "6.3", icon: "fa fa-caret-right", menuname: "Send Auto Prealert", routerlink: "/export/print-documents/prealert/auto", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                    ]
                },
                {
                    menuid: "7", icon: "fa fa-print", menuname: "Report", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [

                        { menuid: "7.1", icon: "fa fa-caret-right", menuname: "EP Copy Cover Sheet", routerlink: "/export/report/epcopyprint", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "7.2", icon: "fa fa-caret-right", menuname: "Chronology", routerlink: "/export/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "7.3", icon: "fa fa-caret-right", menuname: "Delivery Status", routerlink: "/export/report/delivery-status", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "7.4", icon: "fa fa-caret-right", menuname: "Shipment Progress", routerlink: "/export/report/shipment-progress", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "7.5", icon: "fa fa-caret-right", menuname: "EP Copy Excel", routerlink: "/export/report/ep-copy-excel", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "7.6", icon: "fa fa-caret-right", menuname: "DSR", routerlink: "/export/report/dsr", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "7.7", icon: "fa fa-caret-right", menuname: "Tonnage", routerlink: "/export/report/Tonnage", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "7.8", icon: "fa fa-caret-right", menuname: "Shipment Status", routerlink: "/export/report/shipment-status", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "7.9", icon: "fa fa-caret-right", menuname: "Cargo On Hand", routerlink: "/export/report/cargo-on-hand", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "7.10", icon: "fa fa-caret-right", menuname: "Air Cargo Status", routerlink: "/export/report/air-cargo-status", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "7.11", icon: "fa fa-caret-right", menuname: "Tracking Air Booking", routerlink: "/export/report/tracking-air-booking", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "7.12", icon: "fa fa-caret-right", menuname: "Tracking Air Shipment", routerlink: "/export/report/tracking-air-shipment", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                    ]
                },
                {
                     menuid: "8", icon: "fa fa-home", menuname: "Hbl Upload ", routerlink: "/export/hblupload/UploadHbl", ischild: 'n', parentid: 0, isactive: 1, data: [] ,
                }
            ]
        },
        {
            moduleid: "1", modulename: "Accounts", type: null, baseUrl: 'accounts',
            data: [
                { menuid: "1", icon: "fa fa-home", menuname: "Home", routerlink: "/ap/dashboard", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                { menuid: "2", icon: "fa fa-history", menuname: "Master", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                    { menuid: "2.1", icon: "fa fa-plus-circle", menuname: "Bank Reconciliation", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        { menuid: "2.1.1", icon: "fa fa-search-plus", menuname: "Add/Edit", routerlink: "/accounts/Master/Reconcil/Add", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        // { menuid: "2.1.2", icon: "fa fa-search-plus", menuname: "Statement", routerlink: "/accounts/Master/Reconcil/Statement", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "2.1.2b", icon: "fa fa-search-plus", menuname: "Statement(New)", routerlink: "/accounts/Master/Reconcil/StatementNew", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "2.1.3", icon: "fa fa-search-plus", menuname: "Upload Statement", routerlink: "/accounts/uploadbankreconcil/uploadStatement", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "2.1.4", icon: "fa fa-search-plus", menuname: "Upload Statement Search", routerlink: "/accounts/uploadbankreconcil/uploadStatementsearch", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "2.1.6", icon: "fa fa-search-plus", menuname: "Reconciliation Statement", routerlink: "/accounts/uploadbankreconcil/reconciliationStatement", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                ]},
                { menuid: "2.2", icon: "fa fa-file-text", menuname: "26AS TDS Reconcil", routerlink: "/accounts/tds26as/reconcile", ischild: 'n', parentid: 0, isactive: 1, data: [] },
            ]},
                {menuid: "3", icon: "fa fa-money", menuname: "Transaction", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                    {menuid: "3.1", icon: "fa fa-file-text", menuname: "Invoice", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        { menuid: "3.1.1", icon: "fa fa-plus-circle", menuname: "Add", routerlink: "/accounts/transaction/invoice/general/ ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "3.1.2", icon: "fa fa-search-plus", menuname: "Search/Edit", routerlink: "/accounts/transaction/invoice/invoicesearch", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                       //  { menuid: "3.1.3", icon: "fa fa-search-plus", menuname: "Generate EInvoice  ", routerlink: "/accounts/EInvoice/EInvoice", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        // { menuid: "3.1.4", icon: "fa fa-search-plus", menuname: "Upload IRN  ", routerlink: "/accounts/EInvoice/UploadIRN", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "3.1.3", icon: "fa fa-search-plus", menuname: "Print Proforma Invoice", routerlink: "/accounts/transaction/invoice/proformainvoice", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "3.1.4", icon: "fa fa-search-plus", menuname: "Generate Json Invoice ", routerlink: "/accounts/EInvoice/GenerateJson", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "3.1.5", icon: "fa fa-search-plus", menuname: "Upload IRN", routerlink: "/accounts/EInvoice/UploadIRN", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "3.1.6", icon: "fa fa-search-plus", menuname: "Reset Json", routerlink: "/accounts/EInvoice/ResetJson", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                    ]},

                    {menuid: "3.1A", icon: "fa fa-file-text", menuname: "Proforma Invoice", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        { menuid: "3.1A.1", icon: "fa fa-plus-circle", menuname: "Add", routerlink: "/accounts/transaction/proformainvoice/general/ ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "3.1A.2", icon: "fa fa-search-plus", menuname: "Search/Edit", routerlink: "/accounts/transaction/proformainvoice/proformasearch", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                    ]},
                    
                    // {menuid: "3.2", icon: "fa fa-file-text", menuname: "Air Freight", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                    //     { menuid: "3.2.1", icon: "fa fa-plus-circle", menuname: "Generate", routerlink: "/accounts/transaction/airfrtinvoice/airfrtinvoiceList", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                    //     { menuid: "3.2.2", icon: "fa fa-search-plus", menuname: "History", routerlink: "/accounts/transaction/airfrtinvoice/airfrtInvoiceHistory", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                    // ]},
                    { menuid: "3.2", icon: "fa fa-file-text", menuname: "Credit Note", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        { menuid: "3.2.1", icon: "fa fa-plus-circle", menuname: "Add", routerlink: "/accounts/transaction/creditnote/general/ ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "3.2.2", icon: "fa fa-search-plus", menuname: "Search/Edit", routerlink: "/accounts/transaction/creditnote/creditnotesearch", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "3.2.3", icon: "fa fa-search-plus", menuname: "Generate Json ", routerlink: "/accounts/EInvoice/GeneratecnJson", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "3.2.4", icon: "fa fa-search-plus", menuname: "Reset Json", routerlink: "/accounts/EInvoice/ResetcnJson", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                    ] },
                    { menuid: "3.3", icon: "fa fa-credit-card-alt", menuname: "Purchase", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                         { menuid: "3.3.1", icon: "fa fa-cart-plus", menuname: "General", routerlink: "/accounts/purchase/Purchase/PI/1/ ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                         { menuid: "3.3.2", icon: "fa fa-cart-plus", menuname: "Mawb", routerlink: "/accounts/purchase/Purchase/PI/2/ ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                         { menuid: "3.3.3", icon: "fa fa-cart-plus", menuname: "Multicontainer", routerlink: "/accounts/purchase/multicontainer/PI/3/ ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                         { menuid: "3.3.4", icon: "fa fa-search-plus", menuname: "Search/Edit", routerlink: "/accounts/purchase/PurchaseSearch/PI", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                                
                        ]   },   

                 ] }, 
                 {
                    menuid: "4", icon: "fa fa-vine", menuname: "Voucher", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        {
                            menuid: "4.1", menuname: "Journal ", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "4.1.1", icon: "fa fa-plus-circle", menuname: "Add", routerlink: "/accounts/Voucher/JV/Add/JV/ ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                 { menuid: "4.1.2", icon: "fa fa-search-plus", menuname: "Search", routerlink: "/accounts/Voucher/JV/Search/JV", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                            ]
                        },
                        {
                            menuid: "4.2", menuname: "Bank Receipt ", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "4.2.1", icon: "fa fa-plus-circle", menuname: "Add", routerlink: "/accounts/Voucher/BankRecpt/Add/ ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                 { menuid: "4.2.2", icon: "fa fa-search-plus", menuname: "Search", routerlink: "/accounts/Voucher/BankRecpt/Search/BR", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                            ]
                        },
                        {
                            menuid: "4.3", menuname: "Bank Payment ", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "4.3.1", icon: "fa fa-plus-circle", menuname: "Add", routerlink: "/accounts/Voucher/BankPaymnt/Add/ ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                 { menuid: "4.3.2", icon: "fa fa-search-plus", menuname: "Search", routerlink: "/accounts/Voucher/BankRecpt/Search/BP", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                            ]
                        },
                        {
                            menuid: "4.4", menuname: "Cash Receipt ", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "4.4.1", icon: "fa fa-plus-circle", menuname: "Add", routerlink: "/accounts/Voucher/CashRecpt/cashpayment/ ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                 { menuid: "4.4.2", icon: "fa fa-search-plus", menuname: "Search", routerlink: "/accounts/Voucher/BankRecpt/Search/CR", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                            ]
                        },
                        {
                            menuid: "4.5", menuname: "Cash Payment", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "4.5.1", icon: "fa fa-plus-circle", menuname: "Add", routerlink: "/accounts/Voucher/CashPayment/Add/CP/ ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                 { menuid: "4.5.2", icon: "fa fa-search-plus", menuname: "Search", routerlink: "/accounts/Voucher/BankRecpt/Search/CP", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                            ]
                        },
                        {
                            menuid: "4.6", menuname: "Cash Expence ", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "4.6.1", icon: "fa fa-plus-circle", menuname: "Add", routerlink: "/accounts/Voucher/CashExpence/Add/CE/ ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "4.6.2", icon: "fa fa-search-plus", menuname: "Search", routerlink: "/accounts/Voucher/BankRecpt/Search/CE", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "4.6.3", icon: "fa fa-search-plus", menuname: "Generate Cash Receipt", routerlink: "/accounts/Voucher/CashExpence/GencashRecpt", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "4.6.4", icon: "fa fa-search-plus", menuname: "Satement", routerlink: "/accounts/Voucher/CashExpence/Statement", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            ]
                        },

                    ]   
                },
                { menuid: "5", icon: "fa fa-credit-card-alt", menuname: "Computerised Cheque", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        {menuid: "5.1", menuname: "Cheque Stock", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "5.1.1", icon: "fa fa-plus-circle", menuname: "Add", routerlink: "/accounts/CompCheque/Cheque/Add/ ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "5.1.2", icon: "fa fa-search-plus", menuname: "Search/Edit", routerlink: "/accounts/CompCheque/Cheque/search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        ]},
                        {menuid: "5.2",  menuname: "Request Bank Payment", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                            { menuid: "5.2.1", icon: "fa fa-plus-circle", menuname: "Add", routerlink: "/accounts/CompCheque/ReqBP/Add_reqBP/ ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            { menuid: "5.2.2", icon: "fa fa-search-plus", menuname: "Search/Edit", routerlink: "/accounts/Voucher/BankRecpt/Search/CC", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                         ]},
                        {menuid: "5.3", menuname: "Print Cheque", routerlink: "/accounts/CompCheque/prntchque/listprintCheque/", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "5.4" , menuname: "RePrint Cheque ", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "5.4.1", icon: "fa fa-ban", menuname: "Cancel Cheque", routerlink: "/accounts/CompCheque/RePrintCheque/Cancel", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "5.4.2", icon: "fa fa-repeat", menuname: "RePrint", routerlink: "/accounts/CompCheque/RePrintCheque/Reprint", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            ] },
                        {menuid: "5.5",   menuname: "RePrint Existing Cheque", routerlink: "/accounts/CompCheque/ReprintExistingCheque/search", ischild: 'n', parentid: 0, isactive: 1, data: [  ] },
                        { menuid: "5.6",   menuname: "Cheque Error Print", routerlink: "/accounts/CompCheque/ChequeErrorPrint/search", ischild: 'n', parentid: 0, isactive: 1, data: [ ]  },
                        { menuid: "5.7" , menuname: "Cheque Report", routerlink: "/accounts/CompCheque/ChequeRpt/search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                         ]},
                    { menuid: "6", icon: "fa fa-credit-card-alt", menuname: "Request", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        { menuid: "9.1" , menuname: "Staff", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "9.1.1", icon: "fa fa-plus-circle", menuname: "Add", routerlink: "/accounts/Request/staff/StaffPurchaseReq/ ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "9.1.2", icon: "fa fa-search-plus", menuname: "Search/Edit", routerlink: "/accounts/Request/staff/Search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "9.1.3", icon: "fa fa-search-plus", menuname: "Authorisation", routerlink: "/accounts/Request/staff/auth/SRPI", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "9.1.4", icon: "fa fa-search-plus", menuname: "Generate", routerlink: "/accounts/Request/staff/Generate/SRPI", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            ] },
                                { menuid: "9.2" , menuname: "Purchase", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "9.2.1", icon: "fa fa-plus-circle", menuname: "Add", routerlink: "/accounts/purchase/Purchase/RPI/1/ ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "9.2.2", icon: "fa fa-search-plus", menuname: "Search/Edit", routerlink: "/accounts/purchase/PurchaseSearch/RPI", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "9.2.3", icon: "fa fa-search-plus", menuname: "Authorisation", routerlink: "/accounts/Request/staff/auth/RPI", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "9.2.4", icon: "fa fa-search-plus", menuname: "Generate", routerlink: "/accounts/Request/staff/Generate/RPI", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                    
                                ] },    
                                { menuid: "9.3" , menuname: "Journal Voucher", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [   
                                    { menuid: "9.3.1", icon: "fa fa-cart-plus", menuname: "Add", routerlink: "/accounts/Voucher/JV/Add/JVREQ/ ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                    { menuid: "9.3.2", icon: "fa fa-search-plus", menuname: "Search", routerlink: "/accounts/Voucher/JV/Search/JVREQ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                    { menuid: "9.3.3", icon: "fa fa-search-plus", menuname: "Authorisation", routerlink: "/accounts/Voucher/JV/Auth/JVREQ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                    { menuid: "9.3.4", icon: "fa fa-search-plus", menuname: "Generate", routerlink: "/accounts/Request/staff/Generate/JVREQ", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                ] },
                               ]  },        
                { menuid: "10", icon: "fa fa-pencil", menuname: "Authorisation", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        { menuid: "10.1", icon: "fa fa-file-text", menuname: "Invoice", routerlink: "/accounts/Authorisation/InvoiceAuth", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "10.2", icon: "fa fa-sticky-note-o", menuname: "Credit Note", routerlink: "/accounts/Authorisation/CNAuth", ischild: 'n', parentid: 0, isactive: 1, data: [] },    
                        { menuid: "10.3", icon: "fa fa-sticky-note-o", menuname: "Bank Payment", routerlink: "/accounts/CompCheque/ReqBP/AuthList", ischild: 'n', parentid: 0, isactive: 1, data: [] },    

                    ]  },
                {menuid: "11", icon: "fa fa-eraser", menuname: "UnAuthorisation", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        { menuid: "6.1", icon: "fa fa-file-text", menuname: "Invoice", routerlink: "/accounts/UnAuthorisation/InvoiceUnAuth", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                       
                    ]   },
                { menuid: "12", icon: "fa fa-flag", menuname: "Reports", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        { menuid: "12.1", icon: "fa fa-pinterest-p", menuname: "Register", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [        
                            { menuid: "12.1.1",    menuname: "Service Tax Register", routerlink: "/accounts/report/register/ServiceTaxRegistersupport", ischild: 'n', parentid: 0, isactive: 1, data: [] },                    
                            
                            { menuid: "12.1.2",   menuname: "Invoice", routerlink: "/accounts/report/register/Regi/Invoice", ischild: 'n', parentid: 0, isactive: 1, data: [] },    
                            { menuid: "12.1.3",   menuname: "CashBook", routerlink: "/accounts/report/register/Regi/CashBook", ischild: 'n', parentid: 0, isactive: 1, data: [] },  
                            { menuid: "12.1.4",   menuname: "Purchase", routerlink: "/accounts/report/register/Regi/Purchase", ischild: 'n', parentid: 0, isactive: 1, data: [] },    
                            { menuid: "12.1.5",   menuname: "Brokerage", routerlink: "/accounts/report/register/Regi/Brokerage", ischild: 'n', parentid: 0, isactive: 1, data: [] },    
                            { menuid: "12.1.6",   menuname: "Storage", routerlink: "/accounts/report/register/Regi/Storage", ischild: 'n', parentid: 0, isactive: 1, data: [] },    
                            { menuid: "12.1.7",   menuname: "CreditNote", routerlink: "/accounts/report/register/Regi/CreditNote", ischild: 'n', parentid: 0, isactive: 1, data: [] },      
                            { menuid: "12.1.8",   menuname: "Gst", routerlink: "/accounts/report/register/gst", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            { menuid: "12.1.9",   menuname: "GSTR-3B", routerlink: "/accounts/report/register/gstr3b", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            { menuid: "12.1.10",  menuname: "EXPWOP", routerlink: "/accounts/report/register/Regi/EXPWOP", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            { menuid: "12.1.11",  menuname: "TDS Payable Register", routerlink: "/accounts/report/register/tdspayable", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            { menuid: "12.1.12",  menuname: "TDS Receivable Register", routerlink: "/accounts/report/register/tdsreceivable", ischild: 'n', parentid: 0, isactive: 1, data: [] },

                        ] },
                        { menuid: "12.2", icon: "fa fa-file-text", menuname: "Receivables", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                            { menuid: "12.2.1", icon: "fa fa-sticky-note-o", menuname: "Any One Client All Branch", routerlink: "/accounts/report/Receivables/rec", ischild: 'n', parentid: 0, isactive: 1, data: [] },  
                            { menuid: "12.2.2", icon: "fa fa-sticky-note-o", menuname: "Any One Client All Branch-Ageing", routerlink: "/accounts/report/Receivables/age", ischild: 'n', parentid: 0, isactive: 1, data: [] },  
                            { menuid: "12.2.3", icon: "fa fa-sticky-note-o", menuname: "Outstanding Overseas Client", routerlink: "/accounts/report/Receivables/overseas", ischild: 'n', parentid: 0, isactive: 1, data: [] },  
                         
                       
                        ] },

                        { menuid: "12.3", icon: "fa fa-hand-o-right", menuname: "Jobprofit", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                            { menuid: "12.3.1",   menuname: "Job", routerlink: "/accounts/report/JobProfit/JobProfitReport", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            { menuid: "12.3.1",   menuname: "Mawb wise", routerlink: "/accounts/report/JobProfit/MawbJobProfit/MAWB", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            { menuid: "12.3.1",   menuname: "Container", routerlink: "/accounts/report/JobProfit/MawbJobProfit/CNTR", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                       
                        ] },
                        { menuid: "12.4", icon: "fa fa-file-text", menuname: "Account Statement", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                            { menuid: "12.4.1",icon:"fa fa-search", menuname: "Search", routerlink: "/accounts/report/accountstatement/Search/ ", ischild: 'n', parentid: 0, isactive: 1, data: [] },    
                            { menuid: "12.4.2",icon:"fa fa-search", menuname: "General A/c Local", routerlink: "/accounts/report/accountstatement/Genactstmt/", ischild: 'n', parentid: 0, isactive: 1, data: [] },  
                            { menuid: "12.4.3",icon:"fa fa-search", menuname: "Client Followup Status", routerlink: "/accounts/report/accountstatement/clntstatusflp/", ischild: 'n', parentid: 0, isactive: 1, data: [] },      
                        ] },
                        { menuid: "12.5", icon: "fa fa-stack-exchange", menuname: "Itemwise Statement", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                            { menuid: "12.5.1", icon:"fa fa-search",  menuname: "Search", routerlink: "/accounts/report/itemstatement/Item", ischild: 'n', parentid: 0, isactive: 1, data: [] },  
                            // { menuid: "12.4.2", icon:"fa fa-file-excel-o",  menuname: "Export To Excel", routerlink: "", ischild: 'n', parentid: 0, isactive: 1, data: [] },  
                            { menuid: "12.5.2", icon: "fa fa-file-excel-o", menuname: "Export To Excel", routerlink: "/accounts/report/itemstatement/Itemstmt", ischild: 'n', parentid: 0, isactive: 1, data: [] },  
                            { menuid: "12.5.3", icon: "fa fa-microchip",   menuname: "AccountWise Item Statement", routerlink: "/accounts/report/itemstatement/Account", ischild: 'n', parentid: 0, isactive: 1, data: [] }, 
                          
                        ] },
                        { menuid: "12.6", icon: "fa fa-microchip", menuname: "Trial Balance", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                            { menuid: "12.6.1",   menuname: "Date Wise", routerlink: "/accounts/report/Trialbalance/Date", ischild: 'n', parentid: 0, isactive: 1, data: [] },  
                            { menuid: "12.6.2",   menuname: "Group Wise", routerlink: "/accounts/report/Trialbalance/Grp", ischild: 'n', parentid: 0, isactive: 1, data: [] },  
                           
                       
                        ] },
                        { menuid: "12.7", icon: "fa fa-file-text", menuname: "Not Over Report", routerlink: "/accounts/report/notoverreport/", ischild: 'n', parentid: 0, isactive: 1, data: [ ] },
                        { menuid: "12.8", icon: "fa fa-file-text", menuname: "Advance From Client", routerlink: "/accounts/report/advancefromclient/", ischild: 'n', parentid: 0, isactive: 1, data: [  ] },
                        { menuid: "12.9", icon: "fa fa-file-text", menuname: "Special Report", routerlink: "/accounts/report/specialreport/", ischild: 'n', parentid: 0, isactive: 1, data: [ ] },
                    
                    ] },

//'-----------------'
                { menuid: "13", icon:"fa fa-pencil", menuname: "MISReport" , routerlink: "", ischild: 'y',parentis: 0, isactive: 1,data:[
                    { menuid: "13.1",   menuname: "Sundry Expenses Late A/c", routerlink: "/accounts/MisReport/SundryExpense", ischild: 'n', parentid: 0, isactive: 1, data: [ ] },
                    
                        { menuid: "13.2",   menuname: "Account Finalization", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                            { menuid: "13.2.1",   menuname: "Clientwise Income", routerlink: "/accounts/MisReport/ActFinalization/INCOME", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            { menuid: "13.2.2",   menuname: "Supplierwise Expenses ", routerlink: "/accounts/MisReport/ActFinalization/EXPENSE", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                           // { menuid: "13.2.3",   menuname: "General A/c All Branch ", routerlink: "/accounts/report/accountstatement/Search/MIS", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                           { menuid: "13.2.3",   menuname: "General A/c All Branch ", routerlink: "/accounts/MisReport/ActFinalization/act/GenActAllBrach", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            { menuid: "13.2.4",   menuname: "Client Supplier A/c wise List", routerlink: "/accounts/MisReport/ActFinalization/act/CSList", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            { menuid: "13.2.5",   menuname: "Profit & Loss Statement", routerlink: "/accounts/MisReport/ActFinalization/act/ProfitandLossStmt", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            { menuid: "13.2.6",   menuname: "Balance Sheet", routerlink: "/accounts/MisReport/ActFinalization/act/BalSheetStmt", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                           // { menuid: "13.2.3", icon: "fa fa-sticky-note-o", menuname: "General A/c All Branch ", routerlink: "/accounts/Misreport/generalactallbranch/", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                          ] },
                        { menuid: "13.3",   menuname: "Invoicing Delay", routerlink: "/accounts/MisReport/InvoicingDelay/Delay", ischild: 'n', parentid: 0, isactive: 1, data: [  ] },
                        { menuid: "13.4",   menuname: "MAWB Net Frt RATE", routerlink: "/accounts/MisReport/MawbNetFrt/MAWB", ischild: 'n', parentid: 0, isactive: 1, data: [ ] },

                        { menuid: "13.5",   menuname: "Air Freight", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                            { menuid: "13.5.1",   menuname: "Invoice Purchase", routerlink: "/accounts/MisReport/AirFreight/INVPUR", ischild: 'n', parentid: 0, isactive: 1, data: [] },    
                            { menuid: "13.5.2",   menuname: "Hawb CC freight ", routerlink: "/accounts/MisReport/AirFreight/FRTP", ischild: 'n', parentid: 0, isactive: 1, data: [] },  
                            { menuid: "13.5.3",  menuname: "Freight Payable", routerlink: "/accounts/MisReport/AirFreight/FRTP", ischild: 'n', parentid: 0, isactive: 1, data: [] },    
                        ] },

                        { menuid: "13.6",   menuname: "Client Outstanding Ageing", routerlink: "/accounts/MisReport/Clientoutstandingageing/clntAgeing", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                         { menuid: "13.7",   menuname: "Ex Job Search", routerlink: "/accounts/MisReport/ExJobSearch/ExJob", ischild: 'n', parentid: 0, isactive: 1, data: [] },    
                        { menuid: "13.8",   menuname: "Admin Report", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                            { menuid: "13.8.1",   menuname: "Client Register", routerlink: "/accounts/MisReport/AdminReport/ClientRegister/Client", ischild: 'n', parentid: 0, isactive: 1, data: [] },    
                            { menuid: "13.8.2",   menuname: "Supplier Register", routerlink: "/accounts/MisReport/AdminReport/ClientRegister/Supp", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            { menuid: "13.8.3",   menuname: "FY Dr/Cr Difference Audit", routerlink: "/accounts/MisReport/AdminReport/DrCrDiffAudit", ischild: 'n', parentid: 0, isactive: 1, data: [] },

                        ] },
                            { menuid: "13.9",   menuname: "Job Profit", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                            { menuid: "13.9.1",   menuname: "Client Job Profit", routerlink: "/accounts/MisReport/JobProfit/cljbprofit", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            { menuid: "13.9.2",   menuname: "Agent Job Profit", routerlink: "/accounts/MisReport/JobProfit/agtjobprofit", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                             { menuid: "13.9.2",   menuname: "Consignee Job Profit", routerlink: "/accounts/MisReport/JobProfit/consigneejobprofit", ischild: 'n', parentid: 0, isactive: 1, data: [] },

                        ] },
                         { menuid: "13.10",   menuname: "Finance Dashboard", routerlink: "/accounts/MisReport/FinanceDashboard/dashboard", ischild: 'n', parentid: 0, isactive: 1, data: [  ] },
                         { menuid: "13.11",   menuname: "Job Handler / Sales Person Register", routerlink: "/accounts/MisReport/JobHandler/register", ischild: 'n', parentid: 0, isactive: 1, data: [] },

                    ] },    
                   { menuid: "14",  icon: "fa fa-pencil" , menuname: "Client Edi", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [  
                  { menuid: "14.1", icon: "fa fa-pencil", menuname: "Bill Generate", routerlink: "/accounts/ClientEdi/ClientEdidesign", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                  { menuid: "14.2", icon: "fa fa-pencil", menuname: "File Upload", routerlink: "/accounts/ClientEdi/ClientFileUpload", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                 
                  ] },
              
            ]},
        {
            moduleid: "1", modulename: "Accounts Menu", type: 'FRANCE', baseUrl: 'accounts-fra',
            data: [
                {
                    menuid: "1", icon: "fa fa-users", menuname: "Master", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        { menuid: "1.1", icon: "fa fa-caret-right", menuname: "Ex-Rate Sytia", routerlink: "/accounts-fra/master/inv-exch-rate", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "2.2", icon: "fa fa-caret-right", menuname: "Invoice Rate", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                    ]
                },
                {
                    menuid: "2", icon: "fa fa-users", menuname: "Transaction", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        {
                            menuid: "2.1", icon: "fa fa-caret-right", menuname: "Invoice", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "2.1.1", icon: "fa fa-caret-right", menuname: "General", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "2.1.2", icon: "fa fa-caret-right", menuname: "Pimkie Sea", routerlink: "/accounts-fra/report/epcopyprint", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "2.1.3", icon: "fa fa-caret-right", menuname: "Print Authorization", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            ]
                        },
                        {
                            menuid: "2.2", icon: "fa fa-caret-right", menuname: "Purchase", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "2.2.1", icon: "fa fa-caret-right", menuname: "New", routerlink: "/accounts-fra/transaction/purchase/new", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "2.2.2", icon: "fa fa-caret-right", menuname: "Search / Modify", routerlink: "/accounts-fra/transaction/purchase/search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "2.2.3", icon: "fa fa-caret-right", menuname: "Purchase Auto", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            ]
                        },
                        {
                            menuid: "2.3", icon: "fa fa-caret-right", menuname: "Provision", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "2.2.1", icon: "fa fa-caret-right", menuname: "Entry", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "2.2.2", icon: "fa fa-caret-right", menuname: "View", routerlink: "/accounts-fra/report/epcopyprint", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            ]
                        },
                        {
                            menuid: "2.4", icon: "fa fa-caret-right", menuname: "Credit Note", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "2.2.1", icon: "fa fa-caret-right", menuname: "New", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "2.2.2", icon: "fa fa-caret-right", menuname: "Search / Modify", routerlink: "/accounts-fra/report/epcopyprint", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "2.2.3", icon: "fa fa-caret-right", menuname: "Print Authorization", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            ]
                        },
                    ]
                },
                {
                    menuid: "3", icon: "fa fa-users", menuname: "Reports", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        {
                            menuid: "3.1", icon: "fa fa-caret-right", menuname: "Console Profit Summary", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "3.1.1", icon: "fa fa-caret-right", menuname: "Job Recovery", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "3.1.2", icon: "fa fa-caret-right", menuname: "Importer Recovery", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "3.1.3", icon: "fa fa-caret-right", menuname: "Console Recovery", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "3.1.4", icon: "fa fa-caret-right", menuname: "Console Recovery Sea", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "3.1.5", icon: "fa fa-caret-right", menuname: "Anomaly", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "3.1.6", icon: "fa fa-caret-right", menuname: "Account Wise Recovery", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            ]
                        },
                        { menuid: "3.2", icon: "fa fa-caret-right", menuname: "Export Profit Summary", routerlink: "/export/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        {
                            menuid: "3.3", icon: "fa fa-caret-right", menuname: "Register", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "3.3.1", icon: "fa fa-caret-right", menuname: "Invoice Register Summary", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "3.3.2", icon: "fa fa-caret-right", menuname: "Invoice Register Detail", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "3.3.3", icon: "fa fa-caret-right", menuname: "Client Invoice Register", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "3.3.4", icon: "fa fa-caret-right", menuname: "Purchase Register", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "3.3.5", icon: "fa fa-caret-right", menuname: "Purchase Register Details", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "3.3.6", icon: "fa fa-caret-right", menuname: "Credit Note Register Summary", routerlink: "/accounts-fra/report/dsr", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "3.3.7", icon: "fa fa-caret-right", menuname: "Credit Note Register Detail", routerlink: "/accounts-fra/report/dsr", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            ]
                        },
                        {
                            menuid: "3.4", icon: "fa fa-caret-right", menuname: "Turnover", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "3.4.1", icon: "fa fa-caret-right", menuname: "Client Invoice", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "3.4.2", icon: "fa fa-caret-right", menuname: "Summary", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            ]
                        },
                        {
                            menuid: "3.5", icon: "fa fa-caret-right", menuname: "Tonnage Report", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "3.5.1", icon: "fa fa-caret-right", menuname: "Brand Origin & Month Wise", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            ]
                        },
                        { menuid: "3.6", icon: "fa fa-caret-right", menuname: "Delivery Not Invoiced", routerlink: "/accounts-fra/report/dsr", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                    ]
                },
                {
                    menuid: "4", icon: "fa fa-users", menuname: "EDI", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        { menuid: "4.1", icon: "fa fa-caret-right", menuname: "Purchase", routerlink: "/accounts-fra/report/epcopyprint", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.2", icon: "fa fa-caret-right", menuname: "Invoice", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        {
                            menuid: "4.3", icon: "fa fa-caret-right", menuname: "Add Client For EDI", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "4.1", icon: "fa fa-caret-right", menuname: "Add", routerlink: "/accounts-fra/shipment-progress/ship-bill-search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "4.2", icon: "fa fa-caret-right", menuname: "Search/Edit", routerlink: "/accounts-fra/shipment-progress/receipt-cargo-with-job-no-search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            ]
                        },
                        { menuid: "4.4", icon: "fa fa-caret-right", menuname: "3Sussies", routerlink: "/accounts-fra/report/chronology", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                    ]
                },
            ]
        },
        {
            moduleid: "4", modulename: "Import", type: null, baseUrl: 'import',
            data: [
                { menuid: "1", icon: "fa fa-home", menuname: "Home", routerlink: "/import", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                {
                    menuid: "2", icon: "fa fa-folder-o", menuname: "Master", routerlink: "/master", ischild: 'y', parentid: 0, isactive: 1, data: [
                        {
                            menuid: "2.1", icon: "fa fa-ship", menuname: "Vessel", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "2.1.1", icon: "fa fa-plus", menuname: "Add", routerlink: "/import/master/vessel/data-entry", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "2.1.2", icon: "fa fa-search", menuname: "Search/View/Update", routerlink: "/import/master/vessel/search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            ]
                        },
                        {
                            menuid: "2.2", icon: "fa fa-exchange", menuname: "Exchange Rate", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "2.2.1", icon: "fa fa-plus", menuname: "Add", routerlink: "/import/master/exchange-rate/data-entry", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "2.2.2", icon: "fa fa-search", menuname: "Search/View/Update", routerlink: "/import/master/exchange-rate/search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            ]
                        },
                        {
                            menuid: "2.3", icon: "fa fa-plane", menuname: "Airline", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "2.3.1", icon: "fa fa-plus", menuname: "Add", routerlink: "/import/master/airline/data-entry", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "2.3.2", icon: "fa fa-search", menuname: "Search/View/Update", routerlink: "/import/master/airline/search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            ]
                        },
                        {
                            menuid: "2.4", icon: "fa fa-info-circle", menuname: "Misc Job Import", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "2.4.1", icon: "fa fa-plus", menuname: "Add", routerlink: "/import/master/misc-job/data-entry", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "2.4.2", icon: "fa fa-search", menuname: "Search/View/Update", routerlink: "/import/master/misc-job/search", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                            ]
                        }
                    ]
                },
                {
                    menuid: "3", icon: "fa fa-cube", menuname: "Import", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        {
                            menuid: "3.1", icon: "fa fa-ship", menuname: "Sea", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "3.1.1", icon: "fa fa-plus", menuname: "Add", routerlink: "/import/sea/entry-data", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "3.1.2", icon: "fa fa-search", menuname: "Search/View", routerlink: "/import/sea/search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "3.1.2", icon: "fa fa-print", menuname: "Docket Print", routerlink: "/import/sea/docket-print-search", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                            ]
                        },
                        {
                            menuid: "3.2", icon: "fa fa-plane", menuname: "Air", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "3.1.1", icon: "fa fa-plus", menuname: "Add", routerlink: "/import/air/entry-data", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "3.1.2", icon: "fa fa-search", menuname: "Search/View", routerlink: "/import/air/search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "3.1.2", icon: "fa fa-print", menuname: "Docket Print", routerlink: "/import/air/docket-print-search", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            moduleid: "9", modulename: "import", type: null, baseUrl: 'importfra',
            data: [
                {
                    menuid: "1", icon: "fa fa-ticket", menuname: "Consolidation", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        { menuid: "1.1", icon: "fa fa-ship", menuname: "Import Sea [MP CARGO]", routerlink: "/importfra/consolesea/list", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "1.2", icon: "fa fa-binoculars", menuname: "View", routerlink: "/importfra/consolidation/search", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "1.3", icon: "fa fa-info", menuname: "Other", routerlink: "/importfra", ischild: 'y', parentid: 0, isactive: 1, data: [
                            
                            { menuid: "1.3.1", icon: "fa fa-ship", menuname: "Sea", routerlink: "/importfra/console/type/sea", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            { menuid: "1.3.2", icon: "fa fa-plane", menuname: "Air", routerlink: "/importfra/console/type/air", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            { menuid: "1.3.3", icon: "fa fa-caret", menuname: "Other", routerlink: "/importfra/console/type/other", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            { menuid: "1.3.4", icon: "fa fa-caret", menuname: "Search", routerlink: "/importfra/console/search", ischild: 'n', parentid: 0, isactive: 1, data: [] } 

                        ] },

                        
                    ]
                },
                {menuid:"2",icon:"fa fa-container-storage",menuname:"container",routerlink:"/importfra/container/container",ischild: 'n', parentid: 0, isactive: 1, data: [] },
            
                {
                    menuid: "3", icon: "fa fa-plane-arrival", menuname: "Arrival", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        { menuid: "3.1", icon: "fa fa-ship", menuname: "Sea", routerlink: "/importfra/arrival/type/sea", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "3.2", icon: "fa fa-plane", menuname: "Air", routerlink: "/importfra/arrival/type/air", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "3.3", icon: "fa fa-caret", menuname: "Other", routerlink: "/importfra/arrival/type/other", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                    ]
                },
                {
                    menuid: "4", icon: "fa fa-truck", menuname: "Delivery", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        { menuid: "4.1", icon: "fa fa-ship", menuname: "Sea", routerlink: "/importfra/delivery/type/sea", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.2", icon: "fa fa-plane", menuname: "Air", routerlink: "/importfra/delivery/type/air", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                        { menuid: "4.3", icon: "fa fa-caret", menuname: "Other", routerlink: "/importfra/delivery/type/other", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                    ]
                },
                
                {
                    menuid: "5", icon: "fa fa-print", menuname: "Print", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        {
                            menuid: "5.1", icon: "fa fa-ship", menuname: "Sea", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                // { menuid: "5.1.1", icon: "fa fa-caret-right", menuname: "Avis D`Arriviee", routerlink: "/importfra/print/PrintSearch/sea/Avis", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                // { menuid: "5.1.2", icon: "fa fa-caret-right", menuname: "Mise A Disposition", routerlink: "/importfra/print/PrintSearch/sea/Mise", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "5.1.1", icon: "fa fa-caret-right", menuname: "Instructions Douane", routerlink: "/importfra/print/PrintSearch/sea/Douane", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "5.1.2", icon: "fa fa-caret-right", menuname: "Demande De Relache", routerlink: "/importfra/print/PrintSearch/sea/Relache", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "5.1.3", icon: "fa fa-caret-right", menuname: "Ordre De Transport(Individual Shipment)", routerlink: "/importfra/print/PrintSearch/sea/Ordre", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                            ],
                        },
                        {    
                            menuid: "5.2", icon: "fa fa-plane", menuname: "Air", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                // { menuid: "5.2.1", icon: "fa fa-caret-right", menuname: "Avis D`Arriviee", routerlink: "/importfra/print/PrintSearch/air/Avis", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                // { menuid: "5.2.2", icon: "fa fa-caret-right", menuname: "Prealert", routerlink: "/importfra/print/PrintSearch/air/Prealert", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "5.2.1", icon: "fa fa-caret-right", menuname: "Instructions Douane", routerlink: "/importfra/print/PrintSearch/air/Douane", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                // { menuid: "5.2.4", icon: "fa fa-caret-right", menuname: "Bon Magasinier", routerlink: "/importfra/print/PrintSearch/air/Bon", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                            ]
                        },
                    ]
                },
                {
                    menuid: "6", icon: "fa fa-print", menuname: "Report", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        { menuid: "6.1", icon: "fa fa-registered", menuname: "Console Register", routerlink: "/importfra/report/register", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                        { menuid: "6.2", icon: "fa fa-weight", menuname: "Tonnage", routerlink: "", ischild: 'n', parentid: 0, isactive: 1, data: [   ]  },                       
                        { menuid: "6.3", icon: "fa fa-calendar-times", menuname: "Transt Time", routerlink: "/importfra/report/search", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                       
                    ]
                },
            ]

        },
        {
            moduleid: "8", modulename: "Master", type: null, baseUrl: 'master',
            data: [
                { menuid: "1", icon: "fa fa-th-list", menuname: "Request", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                    { menuid: "1.1", icon: "fa fa-registered", menuname: "Exporter", routerlink: "/master/request/client/TEMP/ ", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                    { menuid: "1.2", icon: "fa fa-registered", menuname: "Consignee", routerlink: "/master/request/consignee/TEMP/ ", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                    { menuid: "1.3", icon: "fa fa-registered", menuname: "Supplier", routerlink: "/master/request/supplier/TEMP/ ", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                    { menuid: "1.4", icon: "fa fa-registered", menuname: "Vessel Agent", routerlink: "/master/request/AgentVessel/TEMP/ ", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                    { menuid: "1.5", icon: "fa fa-registered", menuname: "Shipping Line", routerlink: "/master/request/Liner/TEMP/ ", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                   
                ] },
                { menuid: "2", icon: "fa fa-th-list", menuname: "Master", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                    { menuid: "2.1", icon: "fa fa-address-book-o", menuname: "Exporter",   ischild: 'y', parentid: 0, isactive: 1, data: [  
                        { menuid: "2.1.1", icon: "fa fa-address-book-o", menuname: "Add",   routerlink: "/master/request/client/ / ", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                        { menuid: "2.1.2", icon: "fa fa-search", menuname: "Search",   routerlink: "/master/request/search/Exporter", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                        { menuid: "2.1.3", icon: "fa fa-search", menuname: "Request list",   routerlink: "/master/request/search/RequestExporter", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                    ], },
                  
                    { menuid: "2.2", icon: "fa fa-address-book-o", menuname: "Consignee",   ischild: 'y', parentid: 0, isactive: 1, data: [  
                        { menuid: "2.2.1", icon: "fa fa-address-book-o", menuname: "Add",   routerlink: "/master/request/consignee/ / ", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                        { menuid: "2.2.2", icon: "fa fa-search", menuname: "Search",   routerlink: "/master/request/search/consignee", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                        { menuid: "2.2.3", icon: "fa fa-search", menuname: "Request list",   routerlink: "/master/request/search/RequestConsignee", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                        { menuid: "2.2.3", icon: "fa fa-search", menuname: "Add Exporter",   routerlink: "/master/request/search/isExporter", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },

                    ],},
                    { menuid: "2.3", icon: "fa fa-address-book-o", menuname: "Supplier",   ischild: 'y', parentid: 0, isactive: 1, data: [  
                        { menuid: "2.3.1", icon: "fa fa-address-book-o", menuname: "Add",   routerlink: "/master/request/supplier/ / ", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                        { menuid: "2.3.2", icon: "fa fa-search", menuname: "Search",   routerlink: "/master/request/search/supplier", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                        { menuid: "2.3.3", icon: "fa fa-search", menuname: "Request list",   routerlink: "/master/request/search/RequestSupplier", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                   

                    ],},
                    { menuid: "2.4", icon: "fa fa-address-book-o", menuname: "Vessel Agent",   ischild: 'y', parentid: 0, isactive: 1, data: [  
                        { menuid: "2.4.1", icon: "fa fa-address-book-o", menuname: "Add",   routerlink: "/master/request/AgentVessel/ / ", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                        { menuid: "2.4.2", icon: "fa fa-search", menuname: "Search",   routerlink: "/master/request/search/AgentVessel", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                        { menuid: "2.4.3", icon: "fa fa-search", menuname: "Request list",   routerlink: "/master/request/search/RequestAgentVessel", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                   

                    ],},
                    { menuid: "2.5", icon: "fa fa-address-book-o", menuname: "Liner",   ischild: 'y', parentid: 0, isactive: 1, data: [  
                       { menuid: "2.5.1", icon: "fa fa-address-book-o", menuname: "Add",   routerlink: "/master/request/Liner/ / ", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                         { menuid: "2.5.2", icon: "fa fa-search", menuname: "Search",   routerlink: "/master/request/search/Liner", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                         { menuid: "2.5.3", icon: "fa fa-search", menuname: "Request list",   routerlink: "/master/request/search/RequestLiner", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                   

                    ],},
                    { menuid: "2.6", icon: "fa fa-address-book-o", menuname: "Consignee Bank",  ischild: 'y', parentid: 0, isactive: 1, data: [  
                        { menuid: "2.6.1", icon: "fa fa-address-book-o", menuname: "Add",   routerlink: "/master/common/ConsigneeBank/ ", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                        { menuid: "2.6.2", icon: "fa fa-search", menuname: "Search",   routerlink: "/master/request/search/ConsigneeBank", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                     

                    ],}, 
                ] },

                { menuid: "3", icon: "fa fa fa-building", menuname: "City", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                    { menuid: "3.1", icon: "fa fa-registered", menuname: "Add", routerlink: "/master/city/add", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                ],},

                { menuid: "4", icon: "fa fa-creative-commons", menuname: "Common Search", routerlink: "/master/common/Search", ischild: 'n', parentid: 0, isactive: 1, data: [ ],},               
                { menuid: "5", icon: "fa fa-th-list", menuname: "Account", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                    { menuid: "5.1", icon: "fa fa-address-book-o", menuname: "General Account",   ischild: 'y', parentid: 0, isactive: 1, data: [  
                        { menuid: "5.1.1", icon: "fa fa-address-book-o", menuname: "Add",   routerlink: "/master/generalaccount/GeneralAccount/ ", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                        { menuid: "5.1.2", icon: "fa fa-search", menuname: "Search",   routerlink: "/master/generalaccount/GeneralAccountsearch", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                        //{ menuid: "5.1.3", icon: "fa fa-search", menuname: "Add",   routerlink: "/master/generalaccount/ItemCode", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                        
                        
                    ], },
                    { menuid: "5,2", icon: "fa fa-creative-commons", menuname: "Item Code", routerlink: "/master/generalaccount/ItemCode", ischild: 'n', parentid: 0, isactive: 1, data: [ ],},  
                ], },
              { menuid: "6", icon: "fa fa-th-list", menuname: "Sales", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                    // { menuid: "6.1", icon: "fa fa-registered", menuname: "Master Rate Entry", routerlink: "/master/quotation/QuotRate", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                    { menuid: "6.1", icon: "fa fa-registered", menuname: "Quotation", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [  
                        { menuid: "6.1.1", icon: "fa fa-registered", menuname: "Add", routerlink: "/master/quotation/Quotation/ ", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                        { menuid: "6.1.2", icon: "fa fa-registered", menuname: "Search", routerlink: "/master/quotation/QuotationSearch", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                       // { menuid: "6.1.2", icon: "fa fa-registered", menuname: "Design", routerlink: "/master/quotation/QuotationDesign", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                    ] },
                    // { menuid: "6.2", icon: "fa fa-registered", menuname: "salesquotation", routerlink: "/master/salesquotation/salesquotation", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                     { menuid: "6.2", icon: "fa fa-registered", menuname: "Enquiry", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [ 
                        { menuid: "6.2.1", icon: "fa fa-registered", menuname: "Add", routerlink: "/master/quotation/enquiry/ ", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                        { menuid: "6.2.2", icon: "fa fa-registered", menuname: "Search", routerlink: "/master/quotation/enquirysearch", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                ] },
            ]
        },
]},
        {
            moduleid: "12", modulename: "Admin", type: null, baseUrl: 'admin',

            data: [
                { menuid: "1", icon: "fa fa-th-list", menuname: "Profile", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                    { menuid: "1.1", icon: "fa fa-registered", menuname: "Add", routerlink: "/admin/admin/userprofile/ ", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                    { menuid: "1.2", icon: "fa fa-registered", menuname: "Search", routerlink: "/admin/admin/ProfileSearch", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                   
                       
                ] },

                // { menuid: "2", icon: "fa fa-th-list", menuname: "Company", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                //     { menuid: "1.1", icon: "fa fa-registered", menuname: "Add", routerlink: "/admin/company/Company/ ", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                //     { menuid: "1.2", icon: "fa fa-registered", menuname: "Search", routerlink: "/admin/company/Companysearch", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                   
                // ] },

                { menuid: "3", icon: "fa fa-th-list", menuname: "Financial Year", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                    { menuid: "3.1", icon: "fa fa-registered", menuname: "Add", routerlink: "/admin/financialyear/Financialyear/ ", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                    { menuid: "3.2", icon: "fa fa-registered", menuname: "Search", routerlink: "/admin/financialyear/FinancialYearsearch", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                   
                ] },
                // { menuid: "4", icon: "fa fa-th-list", menuname: "Quotation", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                //     { menuid: "4.1", icon: "fa fa-registered", menuname: "Master Rate Entry", routerlink: "/admin/Adminacct/QuotRate", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                //     { menuid: "4.2", icon: "fa fa-registered", menuname: "Generate Quotation", routerlink: "/admin/Adminacct/ClientRate/ ", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                //     { menuid: "4.3", icon: "fa fa-registered", menuname: "Search", routerlink: "/admin/Adminacct/ClientRateSearch", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                   
                // ] },
                // { menuid: "4", icon: "fa fa-th-list", menuname: "User", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                //     { menuid: "4.1", icon: "fa fa-registered", menuname: "Add", routerlink: "/admin/bankpaymentusergroup/BankPaymentUsergroup", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                //     { menuid: "3.2", icon: "fa fa-registered", menuname: "Search", routerlink: "/admin/financialyear/FinancialYearsearch", ischild: 'n', parentid: 0, isactive: 1, data: [  ], },
                   
                // ] },

            
            ]  },
       
        {
            moduleid: "2", modulename: "Module2", type: null, baseUrl: 'ap',
            data: [
                { menuid: "1", icon: "fa fa-users", menuname: "menu1", routerlink: "/ap/dashboard", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                { menuid: "2", icon: "fa fa-users", menuname: "menu1", routerlink: "/ap/dashboard", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                {
                    menuid: "3", icon: "fa fa-users", menuname: "menu1", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                        {
                            menuid: "3.1", icon: "fa fa-users", menuname: "menu1", routerlink: "", ischild: 'y', parentid: 0, isactive: 1, data: [
                                { menuid: "3.1.1", icon: "fa fa-users", menuname: "menu1", routerlink: "/ap/dashboard", ischild: 'n', parentid: 0, isactive: 1, data: [] },
                                { menuid: "3.1.2", icon: "fa fa-users", menuname: "menu1", routerlink: "/ap/dashboard", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                            ]
                        },
                        { menuid: "3.2", icon: "fa fa-users", menuname: "menu1", routerlink: "/ap/dashboard", ischild: 'n', parentid: 0, isactive: 1, data: [] }
                    ]
                }
            ]
        }




    ]
    };
}
