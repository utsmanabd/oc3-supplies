import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailMaterialComponent } from './detail-material.component';

describe('DetailMaterialComponent', () => {
  let component: DetailMaterialComponent;
  let fixture: ComponentFixture<DetailMaterialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailMaterialComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailMaterialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
