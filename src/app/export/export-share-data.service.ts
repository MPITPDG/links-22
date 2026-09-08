import {Component, Injectable, EventEmitter} from '@angular/core'

//Components can import this service and access shared data
@Injectable()
export class SharedDataSerice {
    sharedData: any
    exportEditData: any;
    exportEditViewData: any;
    vesselsharedData: any;
    jobcreationtype:any;
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