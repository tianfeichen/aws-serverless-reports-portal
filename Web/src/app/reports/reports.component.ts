import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { firstBy } from 'thenby';

import { Product } from 'src/app/models/product';
import { ProductsService } from '../admin/products/products.service';
import { ReportsService } from './reports.service';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {

  dataSource: MatTableDataSource<Product>;
  columnsToDisplay = ['site', 'name', 'reportId', 'lastUpdated'];

  @ViewChild(MatSort, {static: true}) sort: MatSort;

  hasProducts: boolean = true;

  constructor(
    private productsService: ProductsService,
    private reportsService: ReportsService,
    private authService: AuthService,
    private notificationService: NotificationService) {
  }

  ngOnInit() {
    const userId: string = this.authService.user.username;
    this.productsService.getProductsByUserId(userId).subscribe(
      (products: Product[]) => {
        this.sortProducts(products);
        this.dataSource = new MatTableDataSource(products);
        this.dataSource.sort = this.sort;
        this.hasProducts = products.length > 0;
      },
      error => {
        this.notificationService.showError(error);
        this.hasProducts = false;
      }
    );
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // sort products by site then product name
  sortProducts(products: Product[]) {
    products.sort(
      firstBy(function (v) { return v.site.toLowerCase(); })
      .thenBy('name')
    );
    return products;
  }

  getSignedUrl(product: Product): string {
    return this.reportsService.getSignedUrl(product.report);
  }
}

