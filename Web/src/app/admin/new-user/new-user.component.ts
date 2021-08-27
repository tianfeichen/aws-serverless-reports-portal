import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { NewUserService } from './new-user.service';
import { NotificationService } from 'src/app/services/notification.service';
import { Site } from 'src/app/models/site';

@Component({
  selector: 'app-new-user',
  templateUrl: './new-user.component.html',
  styleUrls: ['./new-user.component.scss']
})
export class NewUserComponent implements OnInit {
  userForm: FormGroup;
  email: FormControl;
  firstName: FormControl;
  lastName: FormControl;
  company: FormControl;
  site: FormControl;
  accountManager: FormControl;

  sites: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private newUserService: NewUserService,
    private notificationService: NotificationService) {
  }

  ngOnInit() {
    this.email = new FormControl('', Validators.required);
    this.firstName = new FormControl('', Validators.required);
    this.lastName = new FormControl('', Validators.required);
    this.company = new FormControl('', Validators.required);
    this.sites = Object.values(Site);
    this.site = new FormControl(this.sites[0], Validators.required);
    this.accountManager = new FormControl('');
    this.userForm = this.formBuilder.group({
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      company: this.company,
      site: this.site,
      accountManager: this.accountManager
    });

  }

  async onSubmit() {
    if (!this.userForm.valid) {
      return;
    }

    this.newUserService.addUser(this.userForm.value).subscribe(
      user => {
        this.notificationService.showNotification('Invitation has been sent to the customer.');
        this.router.navigate(['admin/users']);
      },
      error => this.notificationService.showError(error)
    );
  }
}
