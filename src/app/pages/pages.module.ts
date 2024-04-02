import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule, DecimalPipe, JsonPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbToastModule, NgbProgressbarModule, NgbPaginationModule, NgbTypeahead, NgbAccordionModule, NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { FlatpickrModule } from 'angularx-flatpickr';
import { NgApexchartsModule } from 'ng-apexcharts';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { SimplebarAngularModule } from 'simplebar-angular';
import { NgxLoadingModule } from 'ngx-loading';
import {AutocompleteLibModule} from 'angular-ng-autocomplete';

import { LightboxModule } from 'ngx-lightbox';

// Load Icons
import { defineElement } from 'lord-icon-element';
import lottie from 'lottie-web';

// Pages Routing
import { PagesRoutingModule } from "./pages-routing.module";
import { SharedModule } from "../shared/shared.module";
import { DashboardComponent } from './dashboard/dashboard.component';
import { ToastsContainer } from './dashboards/dashboard/toasts-container.component';
import { BudgetInputComponent } from './budget-input/budget-input.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { UserSortableHeader } from './user-management/users-sort.directive';
import { ProdplanComponent } from './prodplan/prodplan.component';
import { MaterialComponent } from './master/material/material.component';
import { CostCenterComponent } from './master/cost-center/cost-center.component';
import { CalculationBudgetComponent } from './master/calculation-budget/calculation-budget.component';
import { UsersComponent } from './master/users/users.component';
import { DetailMaterialComponent } from './master/material/detail-material/detail-material.component';

@NgModule({
  declarations: [
    DashboardComponent,
    ToastsContainer,
    BudgetInputComponent,
    UserManagementComponent,
    UserSortableHeader,
    ProdplanComponent,
    MaterialComponent,
    CostCenterComponent,
    CalculationBudgetComponent,
    UsersComponent,
    DetailMaterialComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgbToastModule,
    FlatpickrModule.forRoot(),
    NgApexchartsModule,
    LeafletModule,
    NgbDropdownModule,
    SimplebarAngularModule,
    PagesRoutingModule,
    SharedModule,
    LightboxModule,
    NgxLoadingModule,
    ReactiveFormsModule,
    NgbPaginationModule,
    NgbTypeahead,
    JsonPipe,
    NgbAccordionModule,
    NgbNavModule,
    AutocompleteLibModule,
    NgbTooltipModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [DecimalPipe]
})
export class PagesModule { 
  constructor() {
    defineElement(lottie.loadAnimation);
  }
}
