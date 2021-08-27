import { Component, OnInit, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { firstBy } from 'thenby';

import { ProductsService } from './products.service';
import { NotificationService } from 'src/app/services/notification.service';
import { Product } from 'src/app/models/product';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { ReportsService } from 'src/app/reports/reports.service';
import { SpinnerDialogComponent } from 'src/app/components/spinner-dialog/spinner-dialog.component';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit {
  dataSource: MatTableDataSource<Product>;
  columnsToDisplay = ['site', 'name', 'enabled', 'reportId', 'lastUpdated'];

  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(
    private dialog: MatDialog,
    private productsService: ProductsService,
    private reportsService: ReportsService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef) { }

  private reloadProducts(products: Product[]) {
    this.sortProducts(products);
    this.dataSource = new MatTableDataSource(products);
    this.dataSource.sort = this.sort;
    this.cdr.detectChanges();
  }

  ngOnInit() {
    this.productsService.getProducts().subscribe(
      products => this.reloadProducts(products),
      error => this.notificationService.showError(error)
    );
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // initially sort products by site then product name
  sortProducts(products: Product[]) {
    products.sort(
      firstBy(function (v) { return v.site.toLowerCase(); })
      .thenBy('name')
    );
    return products;
  }

  updateProduct(product: Product, site: string, name: string) {
    if (!site && !name) {
      return;
    }
    if (site) {
      product.site = site;
    }
    if (name) {
      product.name = name;
    }
    this.productsService.updateProduct(product).subscribe(
      updatedProduct => this.notificationService.showNotification('Product has been updated.'),
      error => this.notificationService.showError(error)
    );
  }

  onEnabledChange(product: Product, evt: MatCheckboxChange) {
    this.productsService.toggleProductEnabled(product, evt.checked).subscribe(updated => {
      if (updated) {
        const enabledStatus = evt.checked ? 'enabled' : 'disabled';
        const message = `Product has been ${enabledStatus}.`;
        this.notificationService.showNotification(message)
      }
    });
  }

  createProducts() {
    this.productsService.createProducts().subscribe(
      products => {
        this.notificationService.showNotification('Products have been regenerated.');
        this.productsService.getProducts().subscribe(products => {
          this.reloadProducts(products);
        });
      },
      error => {
        this.notificationService.showError(error);
      }
    );
  }

  confirmGenerateProductReports() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Generate product reports',
        message: 'Are you sure you wish to regenerate reports?',
        primaryButtonText: 'Yes',
        secondaryButtonText: 'Cancel',
        hideCloseButton: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      const spinnerDialogRef = this.dialog.open(SpinnerDialogComponent, {disableClose: true});
      // first generate reports
      this.reportsService.generateProductReports().subscribe(
        products => {
          // then update database recrods
          this.productsService.createProducts().subscribe((products) => {
            // finally close spinner and display notification
            this.notificationService.showNotification('Product reports have been regenerated.');
            spinnerDialogRef.close();
            this.reloadProducts(products);
          });
        },
        error => {
          this.notificationService.showError(error);
          spinnerDialogRef.close();
        }
      );
    });
  }

  getSignedUrl(product: Product): string {
    return this.reportsService.getSignedUrl(product.report);
  }
}
