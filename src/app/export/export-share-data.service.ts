import {Component, Injectable, EventEmitter} from '@angular/core'

//Components can import this service and access shared data
@Injectable()
export class SharedDataSerice {
    sharedData: any
    exportEditData: any;
    exportEditViewData: any;
    vesselsharedData: any;
    jobcreationtype:any;

    /**
     * Export no. of a consignment saved a moment ago (ported from MPERPNG-20). The
     * consignment workspace sets it right before it navigates to the search page; the
     * search page reads it once on init (and clears it) to pin that job to the top of
     * the recent list with a "Saved just now" chip.
     */
    justSavedExptno: string = '';
}
export class VesselSharedDataSerice {
    sharedData: any;// = "String from myService"
    valueChanged: EventEmitter<string> = new EventEmitter()

    changeData(newData: string) {
        this.sharedData = newData;
        this.valueChanged.emit(this.sharedData);
    }
}
export class FcrSharedDataService {
    fcrsharedData: any;
    fcrHbltypesharedData: any;
    fcrhblprinttype: any;
    fcrdraftvisible :any;

}
export class VesselSearchSharedDataService {
    RtnosharedData: any;
    vslPortsharedData: any;

}
export class ContainerIUSharedDataService {
    ContainerID: any;
    Containerno: any;
}

export class cartingVslAgnt {
    VslAgntsharedData: any;
}

export class mblsharedservice {
    jobnoshared: any;
    mblnoshared: any;
}
export class prealertshareservice
{
    mawbnoshrd : any;
}