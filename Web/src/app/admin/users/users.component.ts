import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { firstBy } from "thenby";
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';

import { User } from 'src/app/models/user.js';
import { Product } from 'src/app/models/product.js';
import { UsersService } from './users.service';
import { NotificationService } from 'src/app/services/notification.service';
import { EditUserDialogComponent } from './edit-user-dialog/edit-user-dialog.component';
import { ProductsService } from '../products/products.service';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class UsersComponent implements OnInit {
  dataSource: MatTableDataSource<User>;
  columnsToDisplay = ['expandCollapseIcon', 'company', 'firstName', 'lastName', 'email', 'userCreateDate', 'userStatus', 'enabled', 'editUser', 'deleteUser'];
  expandedUser: User | null;
  allUsers: User[] | null;
  allProducts: Product[] | null;
  // data table's built-in sort
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(
    private usersService: UsersService,
    private productsService: ProductsService,
    private notificationService: NotificationService,
    public dialog: MatDialog) {
  }

  ngOnInit() {
    this.usersService.getUsers().subscribe(users => {
      this.reloadUsers(users);
    });

    this.productsService.getProducts().subscribe(
      products => this.allProducts = products,
      error => this.notificationService.showError(error)
    );
  }

  private reloadUsers(users: User[]) {
    this.sortUsers(users);
    this.allUsers = users;
    this.dataSource = new MatTableDataSource(users);
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = this.filterPredicate.bind(this);
  }

  private getFullName(user: User) {
    return `${user.firstName} ${user.lastName}`;
  }

  filterPredicate(data, filter: string) {
    const accumulator = (currentTerm, key) => {
      return key === 'products' ? `${currentTerm}${this.flattenProductsArray(data.products)}` : `${currentTerm}${data[key]}`;
    };
    const dataStr = Object.keys(data).reduce(accumulator, '').toLowerCase();

    // Transform the filter by converting it to lowercase and removing whitespace.
    const transformedFilter = filter.trim().toLowerCase();
    return dataStr.indexOf(transformedFilter) !== -1;
  }

  flattenProductsArray(data: Array<any>) {
    return (data.length > 0) ? data.map(a => a.name).join('') : "";
  }

  applyFilter(filterValue: string) {
    // convert a few keywords to boolean value of enabled / disabled field
    var filterModifiers = {
      enable: 'true',
      enabled: 'true',
      disable: 'false',
      disabled: 'false'
    };
    if (filterModifiers.hasOwnProperty(filterValue)) {
      this.dataSource.filter = filterModifiers[filterValue];
    } else {
      // the filter value has to be lower case
      this.dataSource.filter = filterValue.trim().toLowerCase();
    }
  }

  // initially sort users by company then first name
  sortUsers(users: User[]) {
    users.sort(
      firstBy(function (v) { return v.company.toLowerCase(); })
      .thenBy('firstName')
    );
    return users;
  }

  onEnabledChange(user: User, evt: MatCheckboxChange) {
    this.usersService.toggleUserEnabled(user, evt.checked).subscribe(updated => {
      if (updated) {
        const enabledStatus = evt.checked ? 'enabled' : 'disabled';
        const message = `Customer has been ${enabledStatus}.`;
        this.notificationService.showNotification(message)
      }
    });
  }

  expandUser(row: User) {
    this.expandedUser = this.expandedUser === row ? null : row;
  }

  openEditDialog(row: User) {
    // Make a copy of the user
    const userToEdit = JSON.parse(JSON.stringify(row)) as User;

    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      data: {
        user: userToEdit,
        products: this.allProducts
      }
    });

    dialogRef.afterClosed().subscribe((result: User) => {
      if (result) {
        const updatedUser = this.allUsers.find((user: User) => user.email === result.email);
        updatedUser.products = result.products;
      }
    });
  }

  confirmDeleteUser(row: User) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete User',
        message: `Are you sure you wish to delete ${this.getFullName(row)}?`,
        primaryButtonText: 'Yes',
        secondaryButtonText: 'Cancel',
        hideCloseButton: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.usersService.deleteUser(row).subscribe(isUserDeleted => {
          
          // Clean up products' users attribute
          if (row.products.length >= ProductsService.UPDATE_LOWER_LIMIT) {
            this.productsService.removeDeletedUsersFromProducts(row).subscribe(
              (result: boolean) => {},
              error => this.notificationService.showError(error));
          }
          
          this.notificationService.showNotification('User has been deleted.');
          const currentActiveUsers = this.allUsers.filter((user: User) => user.email !== row.email);
          this.reloadUsers(currentActiveUsers);
        },
        error => this.notificationService.showError(error));
      }
    });
  }
}
