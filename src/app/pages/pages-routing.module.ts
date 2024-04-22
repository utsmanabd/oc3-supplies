import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Component pages
import { DashboardComponent } from "./dashboard/dashboard.component";
import { BudgetInputComponent } from './budget-input/budget-input.component';
import { ProdplanComponent } from './prodplan/prodplan.component';
import { UsersComponent } from './master/users/users.component';
import { CostCenterComponent } from './master/cost-center/cost-center.component';
import { CalculationBudgetComponent } from './master/calculation-budget/calculation-budget.component';
import { MaterialComponent } from './master/material/material.component';
import { DetailMaterialComponent } from './master/material/detail-material/detail-material.component';
import { LineComponent } from './master/line/line.component';
import { RoleGuard } from '../core/guards/role.guard';

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
      component: MaterialComponent,
      canActivate: [RoleGuard],
      data: { expectedRole: "Admin" }
    },
    {
      path: "master/material/:code",
      component: DetailMaterialComponent,
    },
    {
      path: "master/cost-center",
      component: CostCenterComponent,
      canActivate: [RoleGuard],
      data: { expectedRole: "Admin" }
    },
    {
      path: "master/factory-line",
      component: LineComponent,
      canActivate: [RoleGuard],
      data: { expectedRole: "Admin" }
    },
    {
      path: "master/calc-budget",
      component: CalculationBudgetComponent,
      canActivate: [RoleGuard],
      data: { expectedRole: "Admin" }
    },
    {
      path: "master/users",
      component: UsersComponent,
      canActivate: [RoleGuard],
      data: { expectedRole: "Admin" }
    },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
