import { Injectable } from '@angular/core';
import { Workbook, Worksheet } from 'exceljs';
import * as fs from 'file-saver';
@Injectable({
  providedIn: 'root'
})
export class JobprofitserviceService {
  no1 = 1;
   no2 = 3
  constructor() { }
  exportExceltry(excelData,downloadname) {
    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('Sales Data');
    const data1 = excelData.data1;
    const data2 = excelData.data2;
    const header2=excelData.headers2
    const header1=excelData.headers1
  //  console.log(header1);

   // fill the data in table
   if(excelData.pagetype=="acctwise"){
    data1.forEach(d => {
      const row = worksheet.addRow(d);
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: 'FFFFFFFF'
        }
      };
      row.font = {
        name: 'Times New Roman',
        size: 10,
        color: {
          argb: '00000000',
        },
      }
    });
  }
    if(excelData.pagetype=="date_multijob"){
      worksheet.addRow([]);
      let detailrow = worksheet.getCell('A1');
      detailrow.value = excelData.detail;
    for (var i = 0; i < header1.length; i++) {
 
      if(i==0){
       // worksheet.mergeCells(2,1,2,3);
        worksheet.mergeCells(2, this.no1, 2, this.no2);
        console.log(2, this.no1, 2, this.no2);
        
        //  worksheet.mergeCells('A1:C1');
          worksheet.getRow(2).getCell(this.no1).value =header1[i];
          worksheet.getRow(2).getCell(this.no1).alignment = { horizontal:'center'} ;
          worksheet.getRow(2).getCell(this.no1).border= {
            top: {
              style: 'thin'
            },
            left: {
              style: 'thin'
            },
            bottom: {
              style: 'thin'
            },
            right: {
              style: 'thin'
            }
          };
      }
      else{
      
         this.no1 =  this.no1 + 3
        this.no2 =  this.no2 + 3    
      //   console.log(2, this.no1, 1, this.no2);
       worksheet.mergeCells(2,  this.no1, 2,  this.no2);
         worksheet.getRow(2).getCell(this.no1).value = header1[i];
         worksheet.getRow(2).getCell(this.no1).alignment = { horizontal:'center'} ;
         worksheet.getRow(2).getCell(this.no1).border= {
          top: {
            style: 'thin'
          },
          left: {
            style: 'thin'
          },
          bottom: {
            style: 'thin'
          },
          right: {
            style: 'thin'
          }
        };
       }
      
    };
  }
   
  //header of table by default take name coming from backend

  if(header2 !=""){
    console.log(header2);
    
  let headerRow = worksheet.addRow(header2);
  headerRow.eachCell((cell, number) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '000000' },
      bgColor: { argb: '' }
    }
    cell.font = {
      name: 'Times New Roman',
      bold: true,
      color: { argb: 'FFFFFF' },
      size: 10
    }
    cell.border = {
      top: {
        style: 'thin'
      },
      left: {
        style: 'thin'
      },
      bottom: {
        style: 'thin'
      },
      right: {
        style: 'thin'
      }
    }
  })
  }

     if(data2!=""){
    data2.forEach(d => {
      const row = worksheet.addRow(d);  
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: 'FFFFFFFF'
        }
      };
      row.font = {
        name: 'Times New Roman',
        size: 10,
        color: {
          argb: '00000000',
        },
      },
     row.eachCell({ includeEmpty: true },(cell, number) => {
          cell.border = {
            top: {
              style: 'thin'
            },
            left: {
              style: 'thin'
            },
            bottom: {
              style: 'thin'
            },
            right: {
              style: 'thin'
            }
          };
        });
    });

  }

    //autosize width for cell
    worksheet.columns.forEach(function (column, i) {
      var maxLength = 0;
      column["eachCell"]({ includeEmpty: true }, function (cell) {
        var columnLength = cell.value ? cell.value.toString().length : 12;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength;
    });

    //download file call
    workbook.xlsx.writeBuffer().then((data) => {
      let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, downloadname + '.xlsx');
    })

  }

}
