import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import{ HBLUploadComponent} from './hblupload.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'HblUpload'
        },
        children: [
            { path: 'UploadHbl', component: HBLUploadComponent, data: { title: 'HblUpload / Add' } },
            
             
        ]
    }
];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class HblUploadRoutingModule { }