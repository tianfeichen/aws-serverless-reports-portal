import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from '../material-module';
import { SatPopoverModule } from '@ncstate/sat-popover';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin/admin.component';
import { UsersComponent } from './users/users.component';
import { ProductsComponent } from './products/products.component';
import { NewUserComponent } from './new-user/new-user.component';
import { InlineEditComponent } from './products/inline-edit/inline-edit.component';
import { EditUserDialogComponent } from './users/edit-user-dialog/edit-user-dialog.component';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { SpinnerDialogComponent } from '../components/spinner-dialog/spinner-dialog.component';

@NgModule({
  entryComponents: [
    EditUserDialogComponent,
    ConfirmDialogComponent,
    SpinnerDialogComponent
  ],
  declarations: [
    AdminComponent,
    UsersComponent,
    ProductsComponent,
    NewUserComponent,
    InlineEditComponent,
    EditUserDialogComponent,
    ConfirmDialogComponent,
    SpinnerDialogComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AdminRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    SatPopoverModule,
    HttpClientModule
  ]
})
export class AdminModule { }
