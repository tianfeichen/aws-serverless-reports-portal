import { Component, OnInit, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { User } from 'src/app/models/user';
import { Product } from 'src/app/models/product';
import { MatTableDataSource } from '@angular/material/table';
import { firstBy } from 'thenby';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { NotificationService } from 'src/app/services/notification.service';
import { ProductsService } from '../../products/products.service';

export interface DialogData {
  user: User,
  products: Product[];
}

export interface DataRow {
  id: string;
  name: string;
  site: string;
  selected: Boolean;
}

@Component({
  selector: 'app-edit-user-dialog',
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.scss']
})
export class EditUserDialogComponent implements OnInit {
  dataSource: MatTableDataSource<DataRow>;
  columnsToDisplay = ['selected', 'site', 'name'];

  constructor(
    private productsService: ProductsService,
    private notificationService: NotificationService,
    private dialogRef:MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

  ngOnInit() {
    this.sortProducts(this.data.products);
    const selectedProducts = this.buildDataSource(this.data);
    this.dataSource = new MatTableDataSource(selectedProducts);
  }

  buildDataSource(data: any): DataRow[] {
    const userProducts = data.user.products.map(product => product.id);
    const selectedProducts = data.products.map(product => {
      return {
        id: product.id,
        name: product.name,
        selected: userProducts.includes(product.id),
        site: product.site
      };
    });

    return selectedProducts;
  }

  // initially sort products by site then product name
  sortProducts(products: Product[]) {
    products.sort(
      firstBy(function (v) { return v.site.toLowerCase(); })
      .thenBy('name')
    );
    return products;
  }

  onSelectedChange(product: DataRow, evt: MatCheckboxChange) {
    if (product.selected) {
      const updatedProduct = this.data.products.find(prod => prod.id === product.id);
      this.data.user.products.push(updatedProduct);
    } else {
      this.data.user.products = this.data.user.products.filter(prod => prod.id !== product.id);
    }
  }

  onSaveUser() {
    this.productsService.updateUserProducts(this.data.user).subscribe(updatedUser => {
      this.notificationService.showNotification('User products have been updated.');
      this.dialogRef.close(this.data.user);
    });
  }
}
