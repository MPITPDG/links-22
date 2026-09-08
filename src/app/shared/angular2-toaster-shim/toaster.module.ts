import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToasterContainerComponent } from './toaster-container.component';

@NgModule({
    imports: [CommonModule],
    declarations: [ToasterContainerComponent],
    exports: [ToasterContainerComponent]
})
export class ToasterModule {
    static forRoot(): ModuleWithProviders<ToasterModule> {
        return { ngModule: ToasterModule, providers: [] };
    }
}
