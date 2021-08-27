import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit {

  title: string;
  message: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  hideCloseButton: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {

    this.title = data.title;
    this.message = data.message;
    this.primaryButtonText = data.primaryButtonText;
    this.secondaryButtonText = data.secondaryButtonText;
    this.hideCloseButton = data.hideCloseButton;
  }

  ngOnInit() {
  }

  onClose(button: string): void {
    this.dialogRef.close(button);
  }

}
