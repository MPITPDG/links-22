import { Component, OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { LoginService } from '../../shared/service/loginService';
import {Configuration}  from '../../app.constants'
import { LoaderService } from '../../shared/service/loader.service';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { FileDownloadService } from '../../shared/service/file-download.service';
import { Observable } from 'rxjs';
interface UploadedFile {
  name: string;
  size: string;
  uploadedOn: string;
  type: string;
  url?: string;
}

@Component({
  selector: 'app-client-file-upload',
  templateUrl: './client-fileupload.component.html',
  styleUrls: ['./client-fileupload.component.scss']
})
export class ClientEdiFileUploadComponent implements OnInit {

  // File Selection
  selectedFile: File | null = null;
  isDragOver: boolean = false;

  // Form Fields
  selectedDocType: string = '';
  referenceNo: string = '';
  remarks: string = '';

  // Upload State
  isUploading: boolean = false;
  uploadProgress: number = 0;
  uploadSuccess: boolean = false;
  errorMessage: string = '';
  uploadurl:string="";
    url:string="";
     isDownloading: boolean = false;
  // Uploaded Files List
  uploadedFiles: UploadedFile[] = [];

  // Document Types
  documentTypes = [
    { label: 'Invoice', value: 'INVOICE' },
    { label: 'Packing List', value: 'PACKING_LIST' },
    { label: 'Bill of Lading', value: 'BOL' },
    { label: 'Certificate', value: 'CERTIFICATE' },
    { label: 'Other', value: 'OTHER' }
  ];

  // Allowed file types
  allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  maxFileSize = 10 * 1024 * 1024; // 10MB

  constructor(    private _dataService: DataService,
          private http: HttpClient,
          private _loginService: LoginService,
          private _config:Configuration,
          private _loaderService: LoaderService,
          private fileDownloadService: FileDownloadService) 
          {  }

  ngOnInit(): void {
     this.uploadurl=this._config.ServerWithApiUrl;
     this.url=this.uploadurl + "Accounts/UploadEDIExcelFile";
    //this.loadUploadedFiles();
  }

  // Drag & Drop Events
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      this.validateAndSetFile(files[0]);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  validateAndSetFile(file: File): void {
    this.errorMessage = '';

    // Check file size
    if (file.size > this.maxFileSize) {
      this.errorMessage = 'File size exceeds 10MB limit.';
      return;
    }

    // Check file type
    const extension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['xls', 'xlsx', 'csv', 'pdf', 'doc', 'docx'];
    
    if (!allowedExtensions.includes(extension || '')) {
      this.errorMessage = 'Invalid file type. Please upload XLS, XLSX, CSV, PDF, DOC or DOCX files.';
      return;
    }

    this.selectedFile = file;
    this.uploadSuccess = false;
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.uploadSuccess = false;
    this.errorMessage = '';
  }

  getFileIcon(): string {
    if (!this.selectedFile) return 'fa-file';
    const ext = this.selectedFile.name.split('.').pop().toLowerCase();
    return this.getIconByExtension(ext || '');
  }

  getUploadedFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop().toLowerCase();
    return this.getIconByExtension(ext || '');
  }

  getIconByExtension(ext: string): string {
    const icons: { [key: string]: string } = {
      'pdf': 'fa-file-pdf-o text-danger',
      'xls': 'fa-file-excel-o text-success',
      'xlsx': 'fa-file-excel-o text-success',
      'csv': 'fa-file-text-o text-info',
      'doc': 'fa-file-word-o text-primary',
      'docx': 'fa-file-word-o text-primary'
    };
    return icons[ext] || 'fa-file-o text-secondary';
  }

  getFileSize(): string {
    if (!this.selectedFile) return '';
    const size = this.selectedFile.size;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  uploadFile(): void {
    if (!this.selectedFile ) return;

    this.isUploading = true;
    this.uploadSuccess = false;
    this.errorMessage = '';
    this.uploadProgress = 0;

    // Simulate upload progress
    const interval = setInterval(() => {
      this.uploadProgress += 10;
      if (this.uploadProgress >= 100) {
        clearInterval(interval);
        this.onUploadComplete();
      }
    }, 200);
          const filedata=new FormData();
          filedata.append("file",this.selectedFile,this.selectedFile.name)
          filedata.append("makerid",this._loginService.getLogin()[0].CMPID)
          filedata.append("vguid",this._loginService.getLogin()[0].GUID)
          filedata.append("makerip",this._loginService.getLogin()[0].MAKERIP)
          this.http.post(this.url,filedata)
         .subscribe((data: any) => {
         
            if(data.Table[0].STATUS=="100"){
              alert(data.Table[0].STATUSTXT);
            }
            else {
              alert(data.Table[0].STATUSTXT);
            }
            this.selectedFile=null
            this._loaderService.display(false);
            });
  }

  onUploadComplete(): void {
    this.isUploading = false;
    this.uploadSuccess = true;

    // Add to uploaded files list
    this.uploadedFiles.unshift({
      name: this.selectedFile!.name,
      size: this.getFileSize(),
      uploadedOn: new Date().toLocaleDateString('en-IN'),
      type: this.selectedDocType
    });

    // Reset form after 2 seconds
    setTimeout(() => {
      this.reset();
    }, 2000);
  }

  reset(): void {
    this.selectedFile = null;
    this.selectedDocType = '';
    this.referenceNo = '';
    this.remarks = '';
    this.isUploading = false;
    this.uploadProgress = 0;
    this.uploadSuccess = false;
    this.errorMessage = '';
  }

  loadUploadedFiles()
        {
          if(this.selectedFile== undefined){
            alert('Please select file to upload');
            return false;
          }
          this._loaderService.display(true);
          const filedata=new FormData();
          filedata.append("file",this.selectedFile,this.selectedFile.name)
          filedata.append("makerid",this._loginService.getLogin()[0].CMPID)
          filedata.append("vguid",this._loginService.getLogin()[0].GUID)
          filedata.append("makerip",this._loginService.getLogin()[0].MAKERIP)
          this.http.post(this.url,filedata)
         .subscribe((data: any) => {
         
            if(data.Table[0].STATUS=="100"){
              alert(data.Table[0].STATUSTXT);
            }
            else {
              alert(data.Table[0].STATUSTXT);
            }
            this.selectedFile=null
            this._loaderService.display(false);
            });
  }    


  downloadFile(fileName: string): void {
    this.isDownloading = true;
    this.errorMessage = '';

    this.fileDownloadService.downloadFile(fileName).subscribe(
      (response: any) => {
        // Get filename from response headers or use provided name
        const contentDisposition = response.headers.get('Content-Disposition');
        const downloadFileName = this.getFileName(contentDisposition) || fileName;
        
        // Create blob and download
        this.saveFile(response.body, downloadFileName);
        this.isDownloading = false;
      },
      error => {
        this.errorMessage = 'File download failed. Please try again.';
        this.isDownloading = false;
      }
    );
  }

  // Save file to local machine
  saveFile(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
    link.remove();
  }

  // Get filename from Content-Disposition header
  getFileName(contentDisposition: string): string {
    if (!contentDisposition) return '';
    const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    return matches && matches[1] ? matches[1].replace(/['"]/g, '') : '';
  }

  deleteFile(file: UploadedFile, index: number): void {
    if (confirm(`Delete ${file.name}?`)) {
      this.uploadedFiles.splice(index, 1);
      // Replace with your delete API call
    }
  }
}