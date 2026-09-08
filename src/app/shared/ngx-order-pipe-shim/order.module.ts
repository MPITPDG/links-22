import { NgModule } from '@angular/core';
import { OrderPipe } from './order-by.pipe';

@NgModule({
    declarations: [OrderPipe],
    exports: [OrderPipe],
    providers: [OrderPipe]
})
export class OrderModule { }
