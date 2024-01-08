import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbNavModule, NgbAccordionModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

import { BreadcrumbsComponent } from './breadcrumbs/breadcrumbs.component';
import { ScrollspyDirective } from './scrollspy.directive';

@NgModule({
  declarations: [
    BreadcrumbsComponent,
    ScrollspyDirective
  ],
  imports: [
    CommonModule,
    NgbNavModule,
    NgbAccordionModule,
    NgbDropdownModule,
  ],
  exports: [BreadcrumbsComponent, ScrollspyDirective]
})
export class SharedModule { }
