import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ExchangeRateMasterImportComponent } from './exchange-rate.component';
import { EntryExchangeRateMasterComponent } from './data-entry.component';
import { SearchExchangeRateMasterComponent } from './search.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Vessel'
        },
        children: [
            { path: '', component: ExchangeRateMasterImportComponent, data: { title: 'Home' } },
            { path: 'data-entry', component: EntryExchangeRateMasterComponent, data: { title: 'Data Entry' } },
            { path: 'update-entry/:param', component: EntryExchangeRateMasterComponent, data: { title: 'Update Entry' } },
            { path: 'search', component: SearchExchangeRateMasterComponent, data: { title: 'Search' } },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExchangeRateImportRoutingModule { }
