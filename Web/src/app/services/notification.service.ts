import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar) {
  }

  showNotification(message: string, panelClass: string = 'success') {
    this.show(message, 'success');
  }

  showError(message: string, panelClass: string = 'success') {
    this.show(message, 'error');
  }

  private show(message: string, panelClass: string) {
    this.snackBar.open(message, null, {
      duration: 5 * 1000,
      verticalPosition: 'top',
      panelClass: panelClass
    });
  }
}
