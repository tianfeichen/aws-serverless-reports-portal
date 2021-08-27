import { Component, OnInit, Input, Optional, Host } from '@angular/core';
import { filter } from 'rxjs/operators';
import { SatPopover } from '@ncstate/sat-popover';

@Component({
  selector: 'products-inline-edit',
  templateUrl: './inline-edit.component.html',
  styleUrls: ['./inline-edit.component.scss']
})
export class InlineEditComponent implements OnInit {
  // The property of the model
  @Input()
  property: string;

  // Overrides the comment and provides a reset value when changes are cancelled.
  @Input()
  get value(): string { return this._value; }
  set value(x: string) {
    this.productValue = this._value = x;
  }
  private _value = '';

  // Form model for the input
  productValue = '';

  constructor(@Optional() @Host() public popover: SatPopover) {
  }

  ngOnInit() {
    // subscribe to cancellations and reset form value
    if (this.popover) {
      this.popover.closed.pipe(filter(val => val == null))
        .subscribe(() => {
          this.productValue = this.value || ''
        });
    }
  }

  onSubmit() {
    if (this.popover) {
      this.popover.close(this.productValue);
    }
  }

  onCancel() {
    if (this.popover) {
      this.popover.close();
    }
  }
}
