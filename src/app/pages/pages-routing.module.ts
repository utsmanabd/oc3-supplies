import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Component pages
import { DashboardComponent } from "./dashboard/dashboard.component";
import { BudgetInputComponent } from './budget-input/budget-input.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { ProdplanComponent } from './prodplan/prodplan.component';
import { UsersComponent } from './master/users/users.component';
import { CostCenterComponent } from './master/cost-center/cost-center.component';
import { CalculationBudgetComponent } from './master/calculation-budget/calculation-budget.component';
import { MaterialComponent } from './master/material/material.component';

const routes: Routes = [
    {
        path: "",
        component: DashboardComponent
    },
    {
      path: "supplies",
      component: BudgetInputComponent
    },
    {
      path: "prodplan",
      component: ProdplanComponent
    },
    {
      path: "master/material",
      component: MaterialComponent
    },
    {
      path: "master/cost-center",
      component: CostCenterComponent
    },
    {
      path: "master/calc-budget",
      component: CalculationBudgetComponent
    },
    {
      path: "master/users",
      component: UsersComponent
    },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
