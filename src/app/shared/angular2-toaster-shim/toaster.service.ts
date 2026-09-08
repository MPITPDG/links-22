import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
    id: number;
    type: string;
    title: string;
    body: string;
}

let nextId = 0;

// Drop-in replacement for the abandoned 'angular2-toaster' package (last
// released Dec 2020, incompatible with Angular 16+'s Ivy compiler). Only the
// small subset of the real API this app actually uses is implemented:
// ToasterService.pop(type, title, body), ToasterConfig, and a
// <toaster-container> component.
@Injectable({ providedIn: 'root' })
export class ToasterService {
    toasts$ = new Subject<Toast>();

    pop(type: string, title?: string, body?: string): void {
        this.toasts$.next({ id: nextId++, type, title, body });
    }
}
