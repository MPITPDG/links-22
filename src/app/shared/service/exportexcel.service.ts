import { Injectable } from '@angular/core';
import { Workbook, Worksheet } from 'exceljs';
import * as fs from 'file-saver';
import { clearLine } from 'readline';
import { LoaderService } from './loader.service';
//import * as Excel from 'exceljs';
//import * as ExcelJS from "exceljs/dist/exceljs";

@Injectable({
  providedIn: 'root'
})
export class ExportexcelService {

  constructor(  private _loaderService: LoaderService) {    
   
    }
   

  exportExceltry(excelData, downloadname) {

    //Title, Header & Data
    const title = excelData.title;
    const subtitle = excelData.subtitle;
    const header = excelData.headers
    const data = excelData.data;

    const clntname=excelData.clntname;
    const opbal=excelData.opbal;
    const currenttot=excelData.currenttot;
    const closing=excelData.closing;
    const advance=excelData.advance; 
    const advdata=excelData.advdata;
    const advheaders=excelData.advheaders;
    const currtotal = excelData.currtotal
    const itemname=excelData.itemname;

    const novertotal=excelData.novertotal;

    const subtitle1 = excelData.subtitle1;
    const subtitle2 = excelData.subtitle2;
    const subtitle3 = excelData.subtitle3;
    const subtitle4 = excelData.subtitle4;

    const totpenddata =excelData.totpenddata;
    const recdata=excelData.recdata;
    const UnAdjAmtdata=excelData.UnAdjAmtdata;
    const netoutstanddata=excelData.netoutstanddata;
    const totadvdata=excelData.totadvdata;
    const actstmtalldata=excelData.actstmtalldata;
    const actstmtalltotdata=excelData.actstmtalltotdata;
    const workingdata=excelData.workingdata;
    const totpendheaders=excelData.totpendheaders;
    const recdataheaders=excelData.recdataheaders;
    const unadjamtheaders=excelData.unadjamtheaders;
    const netoutstandheaders=excelData.netoutstandheaders;
    const totadvheaders=excelData.totadvheaders;
    const actstmtheaders=excelData.actstmtheaders;
    const actstmttotheaders=excelData.actstmttotheaders; 
    const workingheaders=excelData.workingheaders;

    //Create a workbook with a worksheet
    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet(' Data');
   
    //title row(Company Name)
    worksheet.addRow([]);    
    let titleRow = worksheet.getCell('A1');
    titleRow.value = title
    titleRow.font = {
      name: 'Times New Roman',
      size: 10,
      underline: 'single',
      bold: true,
      color: { argb: '000000' }
    }
    titleRow.alignment = { vertical: 'middle', horizontal: 'left' }

    //subtitle row(Date information)
    worksheet.addRow([]);
    let subtitleRow = worksheet.getCell('A2');
    subtitleRow.value = subtitle;
    subtitleRow.font = {
      name: 'Times New Roman',
      size: 10,
    }

     //Bank or Cash balance in case of Cashbook condition
    if (excelData.pagetype == "CashBook") {
      worksheet.addRow([]);
      let cashrow = worksheet.getCell('A3');
      if(excelData.Bal1.includes("<B>")){
       var newdata= excelData.Bal1.replace(/<B[^>]*>/g, '').replace(/<\/B>/g, '');
        cashrow.value = "Cash OP Balance :" + newdata;
        cashrow.font = {
          bold:true,
          name: 'Times New Roman',
          size: 10,
        }
      }else{
      cashrow.value = "Cash OP Balance :" + excelData.Bal1;
      cashrow.font = {
        name: 'Times New Roman',
        size: 10,
      }
    }
      worksheet.addRow([]);
      let bankrow = worksheet.getCell('A4');
      if(excelData.Bal2.includes("<B>")){
        var newdata= excelData.Bal2.replace(/<B[^>]*>/g, '').replace(/<\/B>/g, '');
        bankrow.value = "Bank OP Balance :" + newdata;
         bankrow.font = {
           bold:true,
           name: 'Times New Roman',
           size: 10, 
         }
       }else{
        bankrow.value = "Bank OP Balance :" + excelData.Bal2;
        bankrow.font = {
         name: 'Times New Roman',
         size: 10,
       }
      }
    }

    if(excelData.pagetype=="ItemActStatement")
    {
    
     worksheet.addRow([]);
     let ClientNameRow = worksheet.getCell('A3');
     ClientNameRow.value = itemname;
     ClientNameRow.font = {
       name: 'Times New Roman',
       size: 10,
     }
    
    worksheet.addRow([]); 
      //subtitle row(Date information)
      worksheet.addRow([]);
      let crtotaleRow = worksheet.getCell('A5');
      crtotaleRow.value = "Current Total : " + currtotal;
      crtotaleRow.font = {
        name: 'Times New Roman',
        size: 10,
      }
    }
    if(excelData.pagetype=="ClientIncomeTax" || excelData.pagetype=="InvoicingDelay")
    {
    
     worksheet.addRow([]);
     let ClientNameRow = worksheet.getCell('A3');
     ClientNameRow.value = subtitle1;
     ClientNameRow.font = {
       name: 'Times New Roman',
       size: 10,
     }
      worksheet.addRow([]);
      let subtitle1row = worksheet.getCell('A4');
      subtitle1row.value = subtitle2;
      subtitle1row.font = {
        name: 'Times New Roman',
        size: 10,
      }
      worksheet.addRow([]);
      let subtitle2row = worksheet.getCell('A5');
      subtitle2row.value = subtitle3;
      subtitle2row.font = {
        name: 'Times New Roman',
        size: 10,
      }
      worksheet.addRow([]);
      let subtitle3row = worksheet.getCell('A6');
      subtitle3row.value = subtitle4;
      subtitle3row.font = {
        name: 'Times New Roman',
        size: 10,
      }
     
    }
    if(excelData.pagetype=="InvPurchase"){
      worksheet.addRow([]);
     let ClientNameRow = worksheet.getCell('A3');
     ClientNameRow.value = subtitle1;
     ClientNameRow.font = {
       name: 'Times New Roman',
       size: 10,
     }
      worksheet.addRow([]);
      let subtitle1row = worksheet.getCell('A4');
      subtitle1row.value = subtitle2;
      subtitle1row.font = {
        name: 'Times New Roman',
        size: 10,
      }
      worksheet.addRow([]);
      let subtitle2row = worksheet.getCell('A5');
      subtitle2row.value = subtitle3;
      subtitle2row.font = {
        name: 'Times New Roman',
        size: 10,
      }
  }
  if(excelData.pagetype=="SundryExpenses"){
    worksheet.addRow([]);
   let ClientNameRow = worksheet.getCell('A3');
   ClientNameRow.value = subtitle1
   ClientNameRow.font = {
     name: 'Times New Roman',
     size: 10,
   }
     
  }
  if(excelData.pagetype=="ReceivableAnyOneClient"){
    worksheet.addRow([]);
   let subtitle1Row = worksheet.getCell('A3');
   subtitle1Row.value = subtitle1
   subtitle1Row.font = {
     name: 'Times New Roman',
     size: 10,
   }
   worksheet.addRow([]);
   let ClientNameRow = worksheet.getCell('A4');
   ClientNameRow.value = clntname
   ClientNameRow.font = {
     name: 'Times New Roman',
     size: 10,
   }
     
  }
    if(excelData.pagetype=="AccountStatement"|| excelData.pagetype=="ItemStatement" || excelData.pagetype=="ClSuppAcList")
    {
    //ClientName row(Date information)
    worksheet.addRow([]);
    let ClientNameRow = worksheet.getCell('A3');
    ClientNameRow.value = clntname;
    ClientNameRow.font = {
      name: 'Times New Roman',
      size: 10,
    }
    worksheet.addRow([]);
    let opbalRow = worksheet.getCell('A4');
    opbalRow.value = opbal;
    opbalRow.font = {
      name: 'Times New Roman',
      size: 10,
    }
    worksheet.addRow([]);
    let currenttotRow = worksheet.getCell('A5');
    currenttotRow.value = currenttot;
    currenttotRow.font = {
      name: 'Times New Roman',
      size: 10,
    }
    worksheet.addRow([]);
    let closingRow = worksheet.getCell('A6');
    closingRow.value = closing;
    closingRow.font = {
      name: 'Times New Roman',
      size: 10,
    }
    worksheet.addRow([]);
    let advanceow = worksheet.getCell('A7');
    advanceow.value = advance;
    advanceow.font = {
      name: 'Times New Roman',
      size: 10,
    }
    
  }
  if(excelData.pagetype=="ReceivableAnyOneClient"){
    worksheet.addRow([]);
    worksheet.addRow(['Pending Invoices']);
  }
  if(excelData.pagetype=="ReceivableAnyOneClientAgeing"){
    worksheet.addRow([]);
    worksheet.addRow(['TOTAL PENDING AMOUNT']);
  }
    //header of table by default take name coming from backend
    let headerRow = worksheet.addRow(header);
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


    //fill the data in table
    data.forEach(d => {
      let dara1
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

//bold condition in case of cashbook(applied on naration column)
        if(excelData.pagetype == "CashBook"){                 
          dara1= row.getCell('G').value
          if(dara1.includes("<B>")){
            row.getCell('G').value= dara1.replace(/<B[^>]*>/g, '').replace(/<\/B>/g, '');
            row.getCell('G').style= {font:{bold: true}};
          }
        }
        if(excelData.pagetype == "TrialBalanceGrpwise"){                 
          dara1= row.getCell('C').value
          if(dara1 != null){   
          if(dara1.includes("<B>") ){
            row.getCell('C').value= dara1.replace(/<B[^>]*>/g, '').replace(/<\/b>/g, '');
            row.getCell('C').style= {font:{bold: true}};
          }
        }
        }
    
    });
   
//header of table by default take name coming from backend
worksheet.addRow([]);
if(excelData.pagetype=="AccountStatement" || excelData.pagetype=="ItemStatement" )
{
let advheaderRow = worksheet.addRow(advheaders);
advheaderRow.eachCell((cell, number) => {
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
//fill the advdata in table
advdata.forEach(d => {
let advdata1
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
if(excelData.pagetype=="NotOverReport")
{ 
let nheaderRow = worksheet.addRow(novertotal);
nheaderRow.eachCell((cell, number) => {
// cell.fill = {
//   type: 'pattern',
//   pattern: 'solid',
//   fgColor: { argb: '000000' },
//   bgColor: { argb: '' }
// }
cell.font = {
  name: 'Times New Roman',
  bold: true,
  color: { argb: '00000000' },
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
if(excelData.pagetype=="ReceivableAnyOneClient"){
     //totpendheader of table by default take name coming from backend
    
     let totpendheader = worksheet.addRow(totpendheaders);
     totpendheader.eachCell((cell, number) => {
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
      
     totpenddata.forEach(d => {
      let totpend
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
        }
        );
      });
      worksheet.addRow(['Less : Un Adjusted Receipts']);
       //recdataheader of table by default take name coming from backend
     let recdataheader = worksheet.addRow(recdataheaders);
     recdataheader.eachCell((cell, number) => {
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
      
      recdata.forEach(d => {
      let totpend
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
        }
        );
      });

      //unadjamtheaders of table by default take name coming from backend
    //  let unadjamtheader = worksheet.addRow(unadjamtheaders);
    //  unadjamtheader.eachCell((cell, number) => {
    //    cell.fill = {
    //      type: 'pattern',
    //      pattern: 'solid',
    //      fgColor: { argb: '000000' },
    //      bgColor: { argb: '' }
    //    }
    //    cell.font = {
    //      name: 'Times New Roman',
    //      bold: true,
    //      color: { argb: 'FFFFFF' },
    //      size: 10
    //    }
    //    cell.border = {
    //      top: {
    //        style: 'thin'
    //      },
    //      left: {
    //        style: 'thin'
    //      },
    //      bottom: {
    //        style: 'thin'
    //      },
    //      right: {
    //        style: 'thin'
    //      }
    //    }
    //   }) 
      
      UnAdjAmtdata.forEach(d => {
      let totpend
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
        }
        );
      });
      worksheet.addRow([]);
      worksheet.addRow([]);
         //netoutstandheaders of table by default take name coming from backend
     let netoutstandheader = worksheet.addRow(netoutstandheaders);
     netoutstandheader.eachCell((cell, number) => {
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
      
      netoutstanddata.forEach(d => {
      let totpend
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
        }
        );
      });
      worksheet.addRow(['Advances']);

       //recadvheader of table by default take name coming from backend
     let recadvheader = worksheet.addRow(advheaders);
     recadvheader.eachCell((cell, number) => {
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
      
      advdata.forEach(d => {
      let totpend
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
        }
        );
      });
         //totadvheader of table by default take name coming from backend
    //  let totadvheader = worksheet.addRow(totadvheaders);
    //  totadvheader.eachCell((cell, number) => {
    //    cell.fill = {
    //      type: 'pattern',
    //      pattern: 'solid',
    //      fgColor: { argb: '000000' },
    //      bgColor: { argb: '' }
    //    }
    //    cell.font = {
    //      name: 'Times New Roman',
    //      bold: true,
    //      color: { argb: 'FFFFFF' },
    //      size: 10
    //    }
    //    cell.border = {
    //      top: {
    //        style: 'thin'
    //      },
    //      left: {
    //        style: 'thin'
    //      },
    //      bottom: {
    //        style: 'thin'
    //      },
    //      right: {
    //        style: 'thin'
    //      }
    //    }
    //   }) 
      
      totadvdata.forEach(d => {
      let totpend
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
        }
        );
      });
      worksheet.addRow([]);
      worksheet.addRow(['WORKING OF OUTSTANDING']);
      worksheet.addRow([]);
      worksheet.addRow(['Account Statement All']);
      worksheet.addRow([]);
          //actstmtheader of table by default take name coming from backend
     let actstmtheader = worksheet.addRow(actstmtheaders);
     actstmtheader.eachCell((cell, number) => {
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
    
      actstmtalldata.forEach(d => {
      let actdata
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
        }
       
        );
        if(excelData.pagetype == "ReceivableAnyOneClient"){                 
          actdata= row.getCell('F').value
          if(actdata != null){   
          if(actdata.includes("<s>") ||  actdata.includes("<b>")){
            row.getCell('F').value= actdata.replace(/<s[^>]*>/g, '').replace(/<\/s>/g, '').replace(/<b[^>]*>/g, '').replace(/<\/b>/g, '');
            row.getCell('F').style= {font:{bold: true}};
          }
          // if(actdata.includes("<b>") ){
          //   row.getCell('F').value= actdata.replace(/<b[^>]*>/g, '').replace(/<\/b>/g, '');
          //   row.getCell('F').style= {font:{bold: true}};
          // }
        }
        }
      });
  
      // let clmformat=worksheet.getColumn(6)
      // clmformat.eachCell((cell, number) => {
      //     cell.font = {
      //     name: 'Times New Roman',
      //     bold: true,
      //     color: { argb: 'FFFFFF' },
      //     size: 10
      //   }
      // })
     
      worksheet.addRow([]);
      worksheet.addRow([]);
        //actstmttotheader of table by default take name coming from backend
     let actstmttotheader = worksheet.addRow(actstmttotheaders);
     actstmttotheader.eachCell((cell, number) => {
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
  
      actstmtalltotdata.forEach(d => {
      let totpend
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
        }
        );
      });
      worksheet.addRow([]);
      worksheet.addRow([]);
      worksheet.addRow(['Detail Working of Client Bill Wise  OutStanding ']);
      //workingheaders of table by default take name coming from backend
     let workingheader = worksheet.addRow(workingheaders);
     workingheader.eachCell((cell, number) => {
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
      
      workingdata.forEach(d => {
      let totpend
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
        }
        );
      });
}
if(excelData.pagetype=="ReceivableAnyOneClientAgeing"){
  //unadjamtheaders of table by default take name coming from backend
  worksheet.addRow(['UNADJUSTED RECEIPTS']);
      let unadjamtheader = worksheet.addRow(unadjamtheaders);
      unadjamtheader.eachCell((cell, number) => {
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
      
    UnAdjAmtdata.forEach(d => {
      let totpend
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
        }
        );
      });
      worksheet.addRow([]);
      worksheet.addRow(['ADVANCE AMOUNT']);
      let recadvheader = worksheet.addRow(advheaders);
      recadvheader.eachCell((cell, number) => {
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
       
       advdata.forEach(d => {
       let totpend
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
         }
         );
       });
}
    //row for total amount in particular pages on last column of table that is amount
if (excelData.pagetype == "Purchase" || excelData.pagetype == "Storage" || excelData.pagetype == "Brokerage") {
  worksheet.addRow(['','','','','','',excelData.totalamount_text + ":" ,excelData.totalamount_value]);
//     var lastRow = worksheet.lastRow;
// let no=lastRow.number
// let cell
// for (let i: number = 1; i < lastRow.values.length; i++) {
//    cell = lastRow.getCell(i);    
// }
//  var column=cell.address.charAt(0)
// var getRowInsert = worksheet.getRow(++(no));

// getRowInsert.getCell(column).value = excelData.totalamount_text + ":" + excelData.totalamount_value;;
// getRowInsert.fill = {
//   type: 'pattern',
//   pattern: 'solid',
//   fgColor: {
//     argb: 'FFFFFFFF'
//   }
// };
// getRowInsert.font = {
//   name: 'Times New Roman',
//   size: 10,
//   color: {
//     argb: '00000000',
//   },
// },
// getRowInsert.eachCell({ includeEmpty: true },(cell, number) => {
//     cell.border = {
//       top: {
//         style: 'thin'
//       },
//       left: {
//         style: 'thin'
//       },
//       bottom: {
//         style: 'thin'
//       },
//       right: {
//         style: 'thin'
//       }
//     };
//   });
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
     this._loaderService.display(false);
    //download file call
    workbook.xlsx.writeBuffer().then((data) => {
      let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, downloadname + '.xlsx');
    })
     }

     
     exportExcelActStatement(excelData, downloadname) {

      //Title, Header & Data
      const title = excelData.title;
      const subtitle = excelData.subtitle;
      const header = excelData.headers
      const data = excelData.data;
      const clntname=excelData.clntname;
      const opbal=excelData.opbal;
      const currenttot=excelData.currenttot;
      const closing=excelData.closing;
      const advance=excelData.advance; 
      const advdata=excelData.advdata;
      const advheaders=excelData.advheaders;
      //Create a workbook with a worksheet
      let workbook = new Workbook();
      
      let worksheet = workbook.addWorksheet(' Data');
      worksheet.addRow([]);
       
      
      //title row(Company Name)
      let blankRow = worksheet.getCell('A1');
      blankRow.value = ""
      
      worksheet.addRow([]);
      
      //title row(Company Name)
      let titleRow = worksheet.getCell('A2');
      titleRow.value = title
      titleRow.font = {
        name: 'Times New Roman',
        size: 10,
        underline: 'single',
        bold: true,
        color: { argb: '000000' }
      }
      titleRow.alignment = { vertical: 'middle', horizontal: 'left' }
  
      //subtitle row(Date information)
      worksheet.addRow([]);
      let subtitleRow = worksheet.getCell('A3');
      subtitleRow.value = subtitle;
      subtitleRow.font = {
        name: 'Times New Roman',
        size: 10,
      }
  
      //ClientName row(Date information)
      worksheet.addRow([]);
      let ClientNameRow = worksheet.getCell('A4');
      ClientNameRow.value = clntname;
      ClientNameRow.font = {
        name: 'Times New Roman',
        size: 10,
      }
      worksheet.addRow([]);
      let opbalRow = worksheet.getCell('A5');
      opbalRow.value = opbal;
      opbalRow.font = {
        name: 'Times New Roman',
        size: 10,
      }
      worksheet.addRow([]);
      let currenttotRow = worksheet.getCell('A6');
      currenttotRow.value = currenttot;
      currenttotRow.font = {
        name: 'Times New Roman',
        size: 10,
      }
      worksheet.addRow([]);
      let closingRow = worksheet.getCell('A7');
      closingRow.value = closing;
      closingRow.font = {
        name: 'Times New Roman',
        size: 10,
      }
      worksheet.addRow([]);
      let advanceow = worksheet.getCell('A8');
      advanceow.value = advance;
      advanceow.font = {
        name: 'Times New Roman',
        size: 10,
      }
  
      //header of table by default take name coming from backend
      let headerRow = worksheet.addRow(header);
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
  
  
      //fill the data in table
      data.forEach(d => {
        let dara1
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

          //bold condition in case of cashbook(applied on naration column)
                        
          dara1= row.getCell('A').value
          if(dara1.includes("<TD colspan=4> <B>")){
            row.getCell('A').value= dara1.replace(/<B[^>]*>/g, '').replace(/<\/B>/g, '');
            row.getCell('A').value= dara1.replace(/<TD colspan=4> <B[^>]*>/g, '').replace(/<\/B><\/TD>/g, '');
            row.getCell('A').style= {font:{bold: true}};
          }
        

 
      });
  
      
      //header of table by default take name coming from backend
      
    /*  worksheet.addRow([]);
     var row =  worksheet.addRow(["Advance"]);
      let advheaderRow = worksheet.addRow(advheaders);
      advheaderRow.eachCell((cell, number) => {
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
        data.forEach(d => {
      let advdata1
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
      });*/
      //row for total amount in particular pages on last column of table that is amount
  
  
  
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
      
       this._loaderService.display(false);

       
      //download file call
        

      workbook.xlsx.writeBuffer().then((data) => {
        let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        fs.saveAs(blob, downloadname + '.xlsx');
      })
       }

      
   
     
     /**
      * GSTR-3B working book. Kept as its own method rather than another branch in
      * exportExceltry's pagetype chain, because this report is multi-section: each block
      * has its own header row and its own column set.
      *
      * excelData: { title, subtitle,
      *              summaryHeaders/summaryData, netHeaders/netData,
      *              rcmHeaders/rcmData, ledgerHeaders/ledgerData, warnHeaders/warnData }
      */
     exportGstr3b(excelData, downloadname) {
       const workbook = new Workbook();
       const money = '#,##0.00;(#,##0.00);-';

       // one block = optional caption + header row + data rows, written on the given sheet
       const writeBlock = (ws: Worksheet, caption: string, headers: any[], data: any[],
                           moneyFrom: number, fillArgb: string) => {
         if (caption) {
           const capRow = ws.addRow([caption]);
           capRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: '1F3864' } };
         }
         if (!headers || headers.length === 0) { return; }
         const headerRow = ws.addRow(headers);
         headerRow.eachCell((cell) => {
           cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F3864' }, bgColor: { argb: '' } };
           cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' }, size: 10 };
           cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
           cell.border = {
             top: { style: 'thin' }, left: { style: 'thin' },
             bottom: { style: 'thin' }, right: { style: 'thin' }
           };
         });
         if (!data || data.length === 0) {
           ws.addRow(['No data']);
           return;
         }
         data.forEach(d => {
           const row = ws.addRow(d);
           row.font = { name: 'Arial', size: 10, color: { argb: '00000000' } };
           if (fillArgb) {
             row.eachCell({ includeEmpty: true }, (cell) => {
               cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
             });
           }
           row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
             cell.border = {
               top: { style: 'thin' }, left: { style: 'thin' },
               bottom: { style: 'thin' }, right: { style: 'thin' }
             };
             if (colNumber >= moneyFrom && typeof cell.value === 'number') {
               cell.numFmt = money;
               cell.alignment = { horizontal: 'right' };
             }
           });
         });
         ws.addRow([]);
       };

       const autoSize = (ws: Worksheet) => {
         ws.columns.forEach(function (column) {
           let maxLength = 0;
           column['eachCell']({ includeEmpty: true }, function (cell) {
             const len = cell.value ? cell.value.toString().length : 12;
             if (len > maxLength) { maxLength = len; }
           });
           column.width = maxLength < 12 ? 12 : (maxLength > 55 ? 55 : maxLength);
         });
       };

       const titleOn = (ws: Worksheet) => {
         const t = ws.addRow([excelData.title]);
         t.font = { name: 'Arial', size: 11, bold: true };
         const s = ws.addRow([excelData.subtitle]);
         s.font = { name: 'Arial', size: 10 };
         ws.addRow([]);
       };

       // --- Sheet 1 : summary + net position + deferred RCM, in reading order
       const wsMain = workbook.addWorksheet('GSTR-3B Summary');
       titleOn(wsMain);
       writeBlock(wsMain, 'GSTR-3B SECTION WISE (BRANCH WISE)',
                  excelData.summaryHeaders, excelData.summaryData, 3, '');
       writeBlock(wsMain, 'NET POSITION  (liability less set-off)',
                  excelData.netHeaders, excelData.netData, 2, '');
       writeBlock(wsMain, 'REVERSE-CHARGE ITC DEFERRED TO NEXT MONTH  (not in the net position above)',
                  excelData.rcmHeaders, excelData.rcmData, 2, 'FFF2CC');
       autoSize(wsMain);

       // --- Sheet 2 : ledger wise break-up
       const wsLed = workbook.addWorksheet('Ledger Detail');
       titleOn(wsLed);
       writeBlock(wsLed, 'LEDGER WISE BREAK-UP', excelData.ledgerHeaders, excelData.ledgerData, 6, '');
       autoSize(wsLed);

       // --- Sheet 3 : reconciliation warnings
       const wsWarn = workbook.addWorksheet('Reconciliation');
       titleOn(wsWarn);
       writeBlock(wsWarn, 'CHECK BEFORE FILING', excelData.warnHeaders, excelData.warnData, 99, '');
       autoSize(wsWarn);

       this._loaderService.display(false);

       workbook.xlsx.writeBuffer().then((data) => {
         const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
         fs.saveAs(blob, downloadname + '.xlsx');
       });
     }

     /**
      * Single-sheet export used by the GSTR-3B filed archive: the ledger statement as filed
      * beside live data. Rows whose STATUS is not UNCHANGED are tinted so a difference is
      * obvious in the downloaded file, not just on screen.
      *
      * excelData: { title, subtitle, headers, data, statusCol }  statusCol is 1-based.
      */
     exportGstr3bFiling(excelData, downloadname) {
       const workbook = new Workbook();
       const ws = workbook.addWorksheet('Filed Statement');

       const t = ws.addRow([excelData.title]);
       t.font = { name: 'Arial', size: 11, bold: true };
       const s = ws.addRow([excelData.subtitle]);
       s.font = { name: 'Arial', size: 10 };
       ws.addRow([]);

       const headerRow = ws.addRow(excelData.headers);
       headerRow.eachCell((cell) => {
         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F3864' }, bgColor: { argb: '' } };
         cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' }, size: 10 };
         cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
         cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
       });

       const statusIdx = excelData.statusCol;
       (excelData.data || []).forEach(d => {
         const row = ws.addRow(d);
         row.font = { name: 'Arial', size: 10 };
         const status = (statusIdx && d[statusIdx - 1]) ? String(d[statusIdx - 1]) : '';
         const changed = status && status !== 'UNCHANGED';
         row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
           cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
           if (changed) {
             cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
             cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'B91C1C' } };
           }
           if (typeof cell.value === 'number') {
             cell.numFmt = '#,##0.00;(#,##0.00);-';
             cell.alignment = { horizontal: 'right' };
           }
         });
       });

       ws.columns.forEach(function (column) {
         let maxLength = 0;
         column['eachCell']({ includeEmpty: true }, function (cell) {
           const len = cell.value ? cell.value.toString().length : 12;
           if (len > maxLength) { maxLength = len; }
         });
         column.width = maxLength < 12 ? 12 : (maxLength > 45 ? 45 : maxLength);
       });

       this._loaderService.display(false);
       workbook.xlsx.writeBuffer().then((data) => {
         const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
         fs.saveAs(blob, downloadname + '.xlsx');
       });
     }


}











