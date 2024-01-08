import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Component pages
import { DashboardComponent } from "./dashboards/dashboard/dashboard.component";

const routes: Routes = [
    {
        path: "",
        component: DashboardComponent
    },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
