import {Component, Input, Output, ViewChild, EventEmitter, OnInit} from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';

@Component({
    selector: 'app-common-modal',
    template: `
   <div bsModal #childModal="bs-modal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true" [config]="{backdrop: 'static'}">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="modal-title pull-left">{{title}}</h4>
            <button type="button" class="close pull-right" aria-label="Close" (click)="hideChildModal()">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            demo
          </div>

          <div class="modal-footer">
            <div class="pull-left">sdfsdsdsdg
              <button class="btn btn-default" (click)="hide()"> Cancel </button>
              <button class='btn btn-primary' (click)="valueChanged()">Click me</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CommonModalComponent {

    @ViewChild('childModal', {static: false}) public childModal: ModalDirective;
    @Input() title?: string;
    @Output() valueChange = new EventEmitter();
    counter = 0;
    constructor() {
    }
    show() {
        this.childModal.show();
    }
    hide() {
        this.childModal.hide();
    }
	
	hideChildModal(){
		this.childModal.hide();
	}

    valueChanged() { // You can give any function name
        this.counter = this.counter + 1;
        this.valueChange.emit(this.counter);
    }


}


@Component({
    selector: 'app-delete-modal',
    template: `
   <div bsModal #deleteModal="bs-modal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true" [config]="{backdrop: 'static'}">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-body text-center">
	                <p>Do you want to confirm?</p>
	                <button type="button" class="btn btn-default" (click)="confirm()" >Yes</button>
	                <button type="button" class="btn btn-primary" (click)="decline()" >No</button>
           </div>
        </div>
      </div>
    </div>
  `,
})
export class DeleteModalComponent {

    @ViewChild('deleteModal', {static: false}) public deleteModal: ModalDirective;
    @Input() title?: string;

    @Output() confirmYes = new EventEmitter();

    data: any = {
        index: null,
        codeid: null,
        code: null,
        exptno: null
    };

    constructor() {
    }

    show(index, codeid, code, exptno) {
        this.data = {
            index: index,
            codeid: codeid,
            code: (code != "") ? code : "",
            exptno: (exptno != "") ? exptno : ""
        };
        this.deleteModal.show();
    }
    hide() {
        this.deleteModal.show();
    }

    confirm() {
        this.confirmYes.emit(this.data);
        this.deleteModal.hide();
    }

    decline(): void {
        this.data = {
            index: null,
            codeid: null,
            code: null,
            exptno: null
        };
        this.deleteModal.hide();
    }
}

@Component({
    selector: 'app-confirm-modal',
    template: `
   <div bsModal #confirmModal="bs-modal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true" [config]="{backdrop: 'static'}">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-body text-center">
	                <p>Are you sure you want to update?</p>
	                <button type="button" class="btn btn-default" (click)="confirm()" >Yes</button>
	                <button type="button" class="btn btn-primary" (click)="decline()" >No</button>
           </div>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmModalComponent {

    @ViewChild('confirmModal', {static: false}) public confirmModal: ModalDirective;
    @Output() confirmYes = new EventEmitter();

    constructor() {
    }

    show() {
        this.confirmModal.show();
    }
    hide() {
        this.confirmModal.show();
    }

    confirm() {
        this.confirmYes.emit(true);
        this.confirmModal.hide();
    }

    decline(): void {
        this.confirmModal.hide();
    }
}


@Component({
    selector: 'app-ok-modal',
    template: `
   <div bsModal #okModal="bs-modal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true" [config]="{backdrop: 'static'}">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-body text-center">
	            <p>No Record Found.</p>
	            <button type="button" class="btn btn-primary" (click)="hide()" >Ok</button>
           </div>
        </div>
      </div>
    </div>
  `,
})
export class OkModalComponent {

    @ViewChild('okModal', {static: false}) public okModal: ModalDirective;
    constructor() {  }

    show() {
        this.okModal.show();
    }
    hide() {
        this.okModal.hide();
    }
}

@Component({
    selector: 'app-page-load-modal',
    template: `
   <div bsModal #pageLoad="bs-modal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true" [config]="{backdrop: 'static'}">
          <i class="fa fa-spinner fa-spin" style="font-size:48px;color:blue"></i>
    </div>
  `,
    styles: ['.modal{text-align:center;padding:0!important} .modal:before{content:""; display:inline-block;height:100%;vertical-align:middle;margin-right:-4px}.modal-dialog{display:inline-block;text-align:left;vertical-align:middle}']
})
export class PageLoadModalComponent {

    @ViewChild('pageLoad', {static: false}) public pageLoad: ModalDirective;
    constructor() { }

    show() {
        this.pageLoad.show();
    }
    hide() {
        this.pageLoad.hide();
    }
}



export class RedirectPage {
    constructor() { }

    redirectToNewTab(urlType: string) {
        if (urlType == 'EDOC') {
            window.open("http://www.google.com");
        }
    }
}


