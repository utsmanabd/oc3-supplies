import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculationBudgetComponent } from './calculation-budget.component';

describe('CalculationBudgetComponent', () => {
  let component: CalculationBudgetComponent;
  let fixture: ComponentFixture<CalculationBudgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CalculationBudgetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalculationBudgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
