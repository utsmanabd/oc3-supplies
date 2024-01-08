import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbToastModule, NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap';

import { FlatpickrModule } from 'angularx-flatpickr';
import { NgApexchartsModule } from 'ng-apexcharts';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { SimplebarAngularModule } from 'simplebar-angular';

import { LightboxModule } from 'ngx-lightbox';

// Load Icons
import { defineElement } from 'lord-icon-element';
import lottie from 'lottie-web';

// Pages Routing
import { PagesRoutingModule } from "./pages-routing.module";
import { SharedModule } from "../shared/shared.module";
import { DashboardComponent } from './dashboards/dashboard/dashboard.component';
import { ToastsContainer } from './dashboards/dashboard/toasts-container.component';

@NgModule({
  declarations: [
    DashboardComponent,
    ToastsContainer
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
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PagesModule { 
  constructor() {
    defineElement(lottie.loadAnimation);
  }
}
