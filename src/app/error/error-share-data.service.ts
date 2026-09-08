import {Component, Injectable} from '@angular/core';

//Components can import this service and access shared data
@Injectable()
export class ErrorDataSerice {

    verifyData: any = {};
} 