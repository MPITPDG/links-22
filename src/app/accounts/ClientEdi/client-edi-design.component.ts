import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';
import * as Excel from 'exceljs';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';
@Component({
  selector: 'app-client-edi',
  templateUrl: './client-edi-design.component.html',
  styleUrls: ['./client-edi-design.component.scss']
})
export class ClientEdiDesignComponent implements OnInit {
  
 
  message: string = '';
  messageType: string = ''; // 'success', 'error', 'info'
  workOrders: any = []
  displayType: string = "LIST";
  errorMessage:string='';
  headertxt:string="";
  isLoading: boolean = false;
  selectedWONos: string = '';  
  freightdata: any = [];
  chadata: any = [];
  logdata: any = [];
  frtfilename:string="";
  chafilename:string="";
  rarfilename:string="";

    // Adjust this based on your actual filter logic
    searchString: string = '';
      selectAll: boolean = false;
  constructor(
        
          private _dataService: DataService,
          private _toasterService: ToastCommonService,
          private loaderService: LoaderService,
          private _router: Router,
          private http: HttpClient,
          private _activatedRoute: ActivatedRoute,
          private _loginService: LoginService,
          private exportser: ExportexcelService,
      )  { 

    
  }

  ngOnInit(): void {
   this.verifyPermission('423', 'Add')
   this.showdata();
  }
    verifyPermission(formId, userMode) {
    this.loaderService.display(true);
    this._loginService.verifyRights(formId, '')
      .subscribe((data: any) => {
        this._loginService.checkVerify(userMode, data);
        this.loaderService.display(false);
      });
  }
  getFilteredCount(): number {
    if (!this.workOrders) return 0;
    if (!this.searchString) return this.workOrders.length;
    
    // Assuming your pipe filters the data
    // Adjust this based on your actual filter logic
    return this.workOrders.filter(order => {
      return Object.values(order).some(val => 
        val.toString().toLowerCase().includes(this.searchString.toLowerCase())
      );
    }).length;
  }
  hasSelectedItems(): boolean {
    return this.workOrders.some(order => order.checked) || false;
  }

  onSelectAllChange(): void {
    this.workOrders.forEach(order => {
      if (order.ISIRNDONE == 1 && order.ISBOL_SENT == 1 && order.AUTHORISEBY !== 0) {
        order.checked = this.selectAll;
      }
    });
    this.onWOSelectChange();
  }

  showdata(): void {
    // Validate dates
    // if (!this.fromDate || !this.toDate) {
    //   this.showMessage('Please select both from and to dates', 'error');
    //   return;
    // }

    this.loaderService.display(true)
     const jsonmaster = {
            CLIENTCODE: "",
              }
         this._dataService.getData("Accounts/ACC_CLIENT_EDI_GETINVOICEDATA", jsonmaster)
             .subscribe((data: any) => {

                if(data.Table1[0].STATUS=="100"){
                    this.isLoading = true;
                if (data.Table2.length == 0) {
                this._toasterService.toast("warning", "Alert", "No record found");
            }
            else if (data.Table2.length >= 1) {
              this.workOrders = data.Table2;
              this.loaderService.display(false)
            }
                }
             
                })
         
        }
  private showMessage(msg: string, type: string): void {
    this.message = msg;
    this.messageType = type;
    
    // Auto-hide message after 3 seconds
    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, 3000);
  }
 viewinvoice(invRow: string) {

  // invoice number is before first " - "
  const inv = invRow.split(' - ')[0].trim();

  console.log(inv);

  let theTop = (screen.height / 2) - (483 / 2);
  let theLeft = (screen.width / 2) - (780 / 2);
  let toolbar = `resizable=no,scrollbars=no,width=800,height=450,status=no,left=${theLeft},top=${theTop}`;

  window.open(`./#/popup/Account-Invoice-View/${inv}/`, "Invoice View", toolbar);
}
generatelogworkbook(data: any[], title: string): Excel.Workbook {

  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet(title);
  sheet.columns = [
  { header: 'WO No', width: 15 },
  { header: 'Port', width: 10 },
  { header: 'Ship Line', width: 15 },
  { header: 'Ser No', width: 15 },
  { header: 'No of Cont', width: 12 },
  { header: 'Rate', width: 12 },
  { header: 'Bill No', width: 20 },
  { header: 'Bill Date', width: 15 },
  { header: 'Bill Type', width: 15 },
  { header: 'Charge Name', width: 50 }
];
const headerRow = sheet.getRow(1);
sheet.eachRow((row, rowNumber) => {
  if (rowNumber === 1) return;

  row.eachCell(cell => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
});
data.forEach(d => {
  sheet.addRow([
    String(d.WO_ORDERNO || ''),
    String(d.EDI_PORT || ''),
    String(d.EDI_SHIPLINE || ''),
    String(d.EDI_CHARGECODE || ''),
    Number(d.INV_QTY || 0),
    Number(d.INV_RATE || 0),
    String(d.INV_NO || ''),
    d.INV_DT || '',
    String(d.STATUS || ''),
    String(d.INV_DESC || '')
  ]);
});

sheet.eachRow((row) => {
  row.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
});
sheet.getRow(1).font = { bold: true };
sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

return workbook;
}
 generateInvoiceWorkbook(data: any[], title: string): Excel.Workbook {

  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet(title);

  // Title row
//   sheet.mergeCells('A1:H1');
//   sheet.getCell('A1').value = title;
//   sheet.getCell('A1').font = { bold: true, size: 14 };
//   sheet.getCell('A1').alignment = { horizontal: 'center' };

//   // Move cursor to row 2 before setting columns
//   sheet.addRow([]);

//   sheet.columns = [
//     { header: 'WO No', key: 'WO_ORDERNO', width: 15 },
//     { header: 'Port', key: 'EDI_PORT', width: 10 },
//     { header: 'Ship Line', key: 'EDI_SHIPLINE', width: 15 },
//     { header: 'Ser No', key: 'EDI_CHARGECODE', width: 15 },
//     { header: 'No of Cont', key: 'INV_QTY', width: 12 },
//     { header: 'Rate', key: 'INNV_RATE', width: 12 },
//     { header: 'Cha Bill No', key: 'INV_NO', width: 20 },
//     { header: 'Bill Date', key: 'INV_DT', width: 15 }
//   ];
sheet.columns = [
  { header: 'WO No', width: 15 },
  { header: 'Port', width: 10 },
  { header: 'Ship Line', width: 15 },
  { header: 'Ser No', width: 15 },
  { header: 'No of Cont', width: 12 },
  { header: 'Rate', width: 12 },
  { header: 'Cha Bill No', width: 20 },
  { header: 'Bill Date', width: 15 }
];

  // Style header row (row 2)
  const headerRow = sheet.getRow(1);
//   headerRow.font = { bold: true };

//   headerRow.eachCell(cell => {
//     cell.border = {
//       top: { style: 'thin' },
//       left: { style: 'thin' },
//       bottom: { style: 'thin' },
//       right: { style: 'thin' }
//     };
//     cell.alignment = { horizontal: 'center' };
//   });
sheet.eachRow((row, rowNumber) => {
  if (rowNumber === 1) return;

  row.eachCell(cell => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
});
  // Add data
  //data.forEach(d => sheet.addRow(d));
data.forEach(d => {
  sheet.addRow([
    String(d.WO_ORDERNO || ''),
    String(d.EDI_PORT || ''),
    String(d.EDI_SHIPLINE || ''),
    String(d.EDI_CHARGECODE || ''),
    Number(d.INV_QTY || 0),
    Number(d.INV_RATE || 0),
    String(d.INV_NO || ''),
    d.INV_DT || ''
  ]);
});

sheet.eachRow((row) => {
  row.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
});
sheet.getRow(1).font = { bold: true };
sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
// data.forEach(d => {
//   sheet.addRow({
//     WO_ORDERNO: d.WO_ORDERNO.toString(),
//     EDI_PORT: d.EDI_PORT.toString(),
//     EDI_SHIPLINE: d.EDI_SHIPLINE.toString(),
//     EDI_CHARGECODE: Number(d.EDI_CHARGECODE),
//     INV_QTY: Number(d.INV_QTY),
//     INNV_RATE: Number(d.INNV_RATE),
//     INV_NO: d.INV_NO.toString(),
//     INV_DT: d.INV_DT
//   });
// });
// sheet.getColumn('WO_ORDERNO').numFmt = '@';
// sheet.getColumn('EDI_PORT').numFmt = '@';
// sheet.getColumn('EDI_SHIPLINE').numFmt = '@';
// sheet.getColumn('EDI_CHARGECODE').numFmt = '@';
// sheet.getColumn('INV_NO').numFmt = '@';
//   Rate formatting
//  sheet.getColumn(6).numFmt = '#,##0.00';

  return workbook;
}
async downloadInvoices(freightData: any[], chaData: any[]) {

  const zip = new JSZip();

  const freightWorkbook = this.generateInvoiceWorkbook(freightData, 'Freight Invoice');
  const chaWorkbook = this.generateInvoiceWorkbook(chaData, 'CHA Invoice');
  const logWorkbook = this.generatelogworkbook(this.logdata,'Log Data');

  const freightBuffer = await freightWorkbook.xlsx.writeBuffer();
  const chaBuffer = await chaWorkbook.xlsx.writeBuffer();
  const logBuffer = await logWorkbook.xlsx.writeBuffer();

  const freightTxt = this.generateTxtContent(freightData);
  const chaTxt = this.generateTxtContent(chaData);

 var arr = new Uint8Array(chaTxt.split('').map(function (c) {
  return c.charCodeAt(0);
}));


  zip.file(this.frtfilename + '.xlsx', freightBuffer);
  zip.file(this.chafilename + '.xlsx', chaBuffer);
  zip.file(this.chafilename + '_Log.xlsx', logBuffer);
  zip.file(this.frtfilename + '.txt', freightTxt);
  zip.file(this.chafilename + '.txt', chaTxt);

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, this.rarfilename + '.zip');
}
GenerateEdiInvoice(){
    if(this.selectedWONos =='' || this.selectedWONos == undefined){
      alert("Please select at least one Work Order No to generate Invoice");
      return false;
    }
    this.loaderService.display(true)
     const jsonmaster = {
            wonostr: this.selectedWONos,
            makerid:this._loginService.getLogin()[0].CMPID,
            makerip:this._loginService.getLogin()[0].MAKERIP
              }
         this._dataService.getData("Accounts/EDI_CLIENT_BAJAJ_INVOICE_GEN_MANUALLY", jsonmaster)
             .subscribe((data: any) => {
                 //console.log(data);
                 this.isLoading = true;
                 this.frtfilename=data.Table[0].FILENAME1;
                 this.chafilename=data.Table[0].FILENAME;
                 this.rarfilename=data.Table[0].RARFILENAME;
                 this.chadata = data.Table1;
                 this.freightdata = data.Table2;
                 this.logdata=data.Table3;
                console.log(this.freightdata[0].INV_RATE);
                this.downloadInvoices(this.freightdata, this.chadata);
               // this.downloadInvoiceTxtZip(this.freightdata, this.chadata);

                this.showdata();
              this.loaderService.display(false)
            }
        )
         
}
generateTxtContent(data: any[]) {
  const pad = (val: any, len: number) =>
    (val || '').toString().padEnd(len, ' ');

  let lines: string[] = [];

  lines.push(
    pad('WO No', 10) +
    pad('Port', 8) +
    pad('Ship Line', 12) +
    pad('Ser No', 12) +
    pad('No of Cont', 12) +
    pad('Rate', 11) +
    pad('Cha Bill No', 18) +
    pad('Bill Date', 12)
  );

  data.forEach(d => {
    lines.push(
      pad(d.WO_ORDERNO, 10) +
      pad(d.EDI_PORT, 8) +
      pad(d.EDI_SHIPLINE, 12) +
      pad(d.EDI_CHARGECODE, 12) +
      pad(d.INV_QTY, 12) +
      pad(d.INV_RATE, 11) +
      pad(d.INV_NO, 18) +
      pad(d.INV_DT, 12)
    );
  });

  return lines.join('\r\n');
}
generateTxtContent20260210(data: any[]) {
  let lines: string[] = [];

  // Header
  lines.push([
    'WO No',
    'Port',
    'Ship Line',
    'Ser No',
    'No of Cont',
    'Rate',
    'Cha Bill No',
    'Bill Date'
  ].join('\t'));

  // Rows
  data.forEach(d => {
    lines.push([
      (d.WO_ORDERNO || '').toString().trim(),
      (d.EDI_PORT || '').toString().trim(),
      (d.EDI_SHIPLINE || '').toString().trim(),
      (d.EDI_CHARGECODE || '').toString().trim(),
      (d.INV_QTY || 0),
      (d.INV_RATE || 0),
      (d.INV_NO || '').toString().trim(),
      (d.INV_DT || '').toString().trim()
    ].join('\t'));
  });

  return lines.join('\r\n');
}

generateTxtContentold(data: any[]): string {

  const headers = [
    'WO No',
    'Port',
    'Ship Line',
    'Ser No',
    'No of Cont',
    'Rate',
    'Cha Bill No',
    'Bill Date'
  ];

  let content = headers.join('\t') + '\n';

  data.forEach(row => {
    content += [
      row.WO_ORDERNO,
      row.EDI_PORT,
      row.EDI_SHIPLINE,
      row.EDI_CHARGECODE,
      row.INV_QTY,
      row.INV_RATE,
      row.INV_NO,
      row.INV_DT
    ].join('\t') + '\n';
  });

  return content;
}
async downloadInvoiceTxtZip(freightData: any[], chaData: any[]) {

  const zip = new JSZip();

  const freightTxt = this.generateTxtContent(freightData);
  const chaTxt = this.generateTxtContent(chaData);

  zip.file('FreightInvoice.txt', freightTxt);
  zip.file('CHAInvoice.txt', chaTxt);

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'InvoiceTextFiles.zip');
}
GenerateEditxtInvoice() {

  this.loaderService.display(true);

  const jsonmaster = {
    wonostr: this.selectedWONos,
  };

  this._dataService
    .getData("Accounts/EDI_CLIENT_BAJAJ_INVOICE_GEN_MANUALLY", jsonmaster)
    .subscribe((data: any) => {

      this.chadata = data.Table1;
      this.freightdata = data.Table2;

      this.downloadInvoiceTxtZip(this.freightdata, this.chadata);

      this.loaderService.display(false);
    });
}
onWOSelectChange() {
  const selected = this.workOrders
    .filter(o => o.checked)
    .map(o => o.WORKORDERNO);

  this.selectedWONos = selected.join(',');

  console.log(this.selectedWONos);
}
}