import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadGroundplanComponent } from './upload-groundplan.component';

describe('UploadGroundplanComponent', () => {
  let component: UploadGroundplanComponent;
  let fixture: ComponentFixture<UploadGroundplanComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UploadGroundplanComponent]
    });
    fixture = TestBed.createComponent(UploadGroundplanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
