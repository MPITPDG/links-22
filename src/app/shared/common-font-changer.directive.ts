import {Component, Input, OnInit, OnChanges, Injectable} from '@angular/core';

@Component({
    selector: 'app-font-changer',
    template: `
            <i class="{{fontClass}}"></i>
    `,
})
export class FontChangerComponent implements OnInit {
    @Input() fontIndex: number;
    fontClass  ;

    iconList: any = [
        { actualIndex: 0, class: "fa fa-search" },
        { actualIndex: 1, class: "fa fa-spinner fa-spin" },
        { actualIndex: 2, class: "fa fa-pencil" },
        { actualIndex: 3, class: "fa fa-trash" },
        { actualIndex: 4, class: "fa fa-refresh" },
        { actualIndex: 5, class: "fa fa-plus" },
        { actualIndex: 6, class: "fa fa-undo" },
        { actualIndex: 7, class: "fa fa-ban" },
        { actualIndex: 8, class: "fa fa-refresh fa-spin" },
        { actualIndex: 9, class: "fa fa-minus-square" },
        { actualIndex: 10, class: "fa fa-plus-square" },
        { actualIndex: 11, class: "fa fa-refresh fa-spin" },
        { actualIndex: 12, class: "fa fa-print" },
        { actualIndex: 13, class: "fa fa-print fa-spin" },
        { actualIndex: 14, class: "fa fa-check-square-o" },
        { actualIndex: 15, class: "fa fa-square-o" },
    ];

    ngOnInit() {
        this.fontClass = this.iconList[this.fontIndex].class;
    }

    changeFontOnly(index) {
        this.fontClass = this.iconList[index].class;
    }

    changeFontwithDisableButton(index, buttonEleref) {
        buttonEleref.nativeElement.disabled = true;
        this.fontClass = this.iconList[index].class;
    }

    changeFontwithEnableButton(index, buttonEleref) {
       // console.log(index);
      //  console.log(buttonEleref);
         buttonEleref.nativeElement.disabled = false;
         this.fontClass = this.iconList[index].class;
    }

    disableButton(buttonEleref) {
        buttonEleref.nativeElement.disabled = true;
    }

    enableButton(buttonEleref) {
        buttonEleref.nativeElement.disabled = false;
    }
} 


@Injectable()
export class ButtonService {

    constructor() { }

    disableButton(buttonEleref) {
        buttonEleref.nativeElement.disabled = true;
    }

    enableButton(buttonEleref) {
        buttonEleref.nativeElement.disabled = false;
    }
}