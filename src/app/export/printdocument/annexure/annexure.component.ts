import { Component, ViewChild, ElementRef } from '@angular/core';

@Component({
    templateUrl: 'annexure.component.html'
})
export class AnnexureComponent {
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    exptno: any = '';
    viewType: number = 999; 
    constructor() { }


    getSearchType(event){
        this.viewType = event.view;
        this.exptno = event.exptno;
    }

    getEditType(event){
        this.viewType = event.view;
    }
}