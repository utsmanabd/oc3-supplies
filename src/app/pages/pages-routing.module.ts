import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Component pages
import { DashboardComponent } from "./dashboards/dashboard/dashboard.component";
import { BudgetInputComponent } from './budget-input/budget-input.component';

const routes: Routes = [
    {
        path: "",
        component: DashboardComponent
    },
    {
      path: "input",
      component: BudgetInputComponent
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
