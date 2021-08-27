import { Injectable } from '@angular/core';
import { Observable, of, zip, forkJoin } from 'rxjs';
import { mergeMap, mergeAll, toArray, map } from 'rxjs/operators';
import * as AWS from 'aws-sdk';
import * as uuid from 'uuid';
import { DocumentClient, WriteRequest } from 'aws-sdk/clients/dynamodb';

import { Product } from 'src/app/models/product';
import { Report } from 'src/app/models/report';
import { AuthService } from 'src/app/auth/auth.service';
import { ReportsService } from 'src/app/reports/reports.service';
import { environment } from 'src/environments/environment';
import { User } from 'src/app/models/user';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  documentClient: Observable<AWS.DynamoDB.DocumentClient>;

  // DynamoDB Update Limits
  static readonly UPDATE_UPPER_LIMIT = 25;
  static readonly UPDATE_LOWER_LIMIT = 1;

  constructor(
    private authService: AuthService,
    private reportsService: ReportsService) {

    this.documentClient = this.authService.credentials.pipe(
      mergeMap(credentials => {
        const documentClient = new AWS.DynamoDB.DocumentClient({
          region: environment.region,
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
          dynamoDbCrc32: false
        });
        return of(documentClient);
      })
    );
  }

  getProducts(): Observable<any> {
    const params = {
      TableName : this.getTableName()
    };

    return Observable.create(observer => {

      this.documentClient.subscribe(documentClient => {
        documentClient.scan(params, function(err, data) {
          if (err) {
            console.warn(err);
            observer.error(err);
            return;
          }

          const products = data.Items;
          products.forEach(p => {
            p.report.updated = new Date(p.report.updated);
            p.users = p.users || [];
          });
          observer.next(products);
          observer.complete();
        });
      });

    });
  }

  createProduct(product: Product): Observable<Product> {
    product.id = uuid.v4();
    product.report.updated = (product.report.updated as Date).toISOString();
    const params: DocumentClient.PutItemInput = {
      TableName : this.getTableName(),
      Item: product
    };

    return Observable.create(observer => {

      this.documentClient.subscribe(documentClient => {
        documentClient.put(params, function(err, data) {
          if (err) {
            console.warn(err);
            observer.error(err);
            return;
          }

          observer.next(product);
          observer.complete();
        });
      });

    });
  }

  updateProduct(product: Product): Observable<Product> {
    const params: DocumentClient.UpdateItemInput = {
      TableName : this.getTableName(),
      Key: { 'id': product.id },
      UpdateExpression: 'SET #name = :name, site = :site',
      ExpressionAttributeNames: {'#name' : 'name'},
      ExpressionAttributeValues: {':name': product.name, ':site': product.site}
    };

    return Observable.create(observer => {

      this.documentClient.subscribe(documentClient => {
        documentClient.update(params, function(err, data) {
          if (err) {
            console.warn(err);
            observer.error(err);
            return;
          }

          observer.next(product);
          observer.complete();
        });
      });

    });
  }

  updateProductReportTimestamp(product: Product): Observable<Product> {
    const params: DocumentClient.UpdateItemInput = {
      TableName : this.getTableName(),
      Key: { 'id': product.id },
      UpdateExpression: 'SET report.updated = :updated',
      ExpressionAttributeValues: {':updated': product.report.updated}
    };

    return Observable.create(observer => {

      this.documentClient.subscribe(documentClient => {
        documentClient.update(params, function(err, data) {
          if (err) {
            console.warn(err);
            observer.error(err);
            return;
          }

          observer.next(product);
          observer.complete();
        });
      });

    });
  }

  toggleProductEnabled(product: Product, enabled: boolean): Observable<boolean> {
    const params: DocumentClient.UpdateItemInput = {
      TableName : this.getTableName(),
      Key: { 'id': product.id },
      UpdateExpression: 'SET enabled = :enabled',
      ExpressionAttributeValues: {':enabled': product.enabled}
    };

    return Observable.create(observer => {

      this.documentClient.subscribe(documentClient => {
        documentClient.update(params, (err, data) => {
          observer.next(err == null)
          observer.complete();
        });
      });

    });
  }

  /**
   * Create database records for products based from S3 report assets.
   * @returns {Observable<Product[]>}
   * @memberof ProductsService
   */
  createProducts(): Observable<Product[]> {
    // first load both reports and products
    const reportsObservable = this.reportsService.getReportsWithMetadata();
    const productsObservable = this.getProducts();

    return zip(reportsObservable, productsObservable).pipe(
      mergeMap(responses => {
        const reports: Report[] = responses[0];
        const products: Product[] = responses[1];

        // for each report, see if there is a matched product
        return of(reports).pipe(
          mergeAll(),
          mergeMap((report: Report) => {
            const matchedProduct = products.find(p => p.report.id === report.id);
            if (!matchedProduct) {
              // matched product is not found: need to create corresponding product
              const product: Product = {
                id: uuid.v4(),
                name: report.name,
                site: report.site,
                enabled: true,
                report: report,
                users: []
              }
              return this.createProduct(product);
            } else {
              // matched product is found: no need to create product again, just update their timestamp
              matchedProduct.report.updated = (report.updated as Date).toISOString();
              return this.updateProductReportTimestamp(matchedProduct);
            }
          }),
          toArray()
        );

      })
    );
  }

  updateUserProducts(user: User): Observable<User> {
    return this.getProducts().pipe(
      map((allProducts: Product[]) => {
        const productsToUpdate = this.getUpdatedProducts(user, allProducts);
        return productsToUpdate;
      }),
      mergeMap((products: Product[]) => {
        return this.batchUpdateAllProducts(products);
      }),
      mergeMap(() => {
        return of(user);
      })
    );
  }

  getUpdatedProducts(user: User, allProducts: Product[]): Product[] {
    // products that user selected
    // (in user.products)
    const matchedProducts = this.getUserSelectedProducts(user, allProducts);
    matchedProducts.forEach(product => {
      const matchedUserInCurrentProduct = product.users.find(u => u === user.username);
      if (!matchedUserInCurrentProduct) {
        product.users.push(user.username);
      }
    });
    // products that has user but not being selected by user
    // (in product.users but not in user.products)
    const unmatchedProducts = allProducts.map(product => {
      if (matchedProducts.find(p => p.id === product.id) === undefined) {
        const matchedUserInCurrentProduct = product.users.find(u => u === user.username);
        if (matchedUserInCurrentProduct) {
          const userIndex = product.users.indexOf(matchedUserInCurrentProduct);
          product.users.splice(userIndex, 1);
          return product;
        }
      }
    }).filter(Boolean);

    const updatedProducts = matchedProducts.concat(unmatchedProducts);
    return updatedProducts;
  }

  getUserSelectedProducts(user: User, allProducts: Product[]): Product[] {
    const matchedProducts = allProducts.map((product: Product) => {
      if (user.products.find(p => p.id === product.id)) {
        return product;
      }
    }).filter(Boolean);
    return matchedProducts;
  }

  batchUpdateAllProducts(products: Product[]): Observable<boolean> {
    const maxUpdateSize = ProductsService.UPDATE_UPPER_LIMIT;

    if (products.length < maxUpdateSize) {
      return this.batchUpdateProducts(products);
    }

    // prepare the batches of product observables
    const batches: Observable<any>[] = [];
    const copied = this.copyArray(products);
    const numOfChild = Math.ceil(copied.length / maxUpdateSize);

    for (let batchIterator = 0; batchIterator < numOfChild; batchIterator++) {
      const currentProducts = copied.splice(0, maxUpdateSize);
      const batch = this.batchUpdateProducts(currentProducts);
      batches.push(batch);
    }

    return forkJoin(batches).pipe(
      mergeMap(() => {
        return of(true);
      })
    );
  }

  batchUpdateProducts(products: Product[]): Observable<boolean> {
    const params = this.convertProductsToRequestParams(products);

    return Observable.create(observer => {

      this.documentClient.subscribe(documentClient => {
        documentClient.batchWrite(params, function(err, data) {
          if (err) {
            console.warn(err);
            observer.error(err);
            return;
          }

          observer.next(true);
          observer.complete();
        });
      });

    });
  }

  convertProductsToRequestParams(products: Product[]): DocumentClient.BatchWriteItemInput {
    const requestItems: WriteRequest[] = [];
    products.forEach(product => {
      if (product.report.updated instanceof Date) {
        product.report.updated = product.report.updated.toISOString();
      }
      const requestItem = {
        PutRequest: {
          Item: product as any
        }
      }
      requestItems.push(requestItem);
    });

    const params: DocumentClient.BatchWriteItemInput = {
      RequestItems: { }
    };
    params.RequestItems[this.getTableName()] = requestItems;

    return params;
  }

  getProductsByUserId(userId: string): Observable<Product[]> {
    return this.getProducts().pipe(
      map((allProducts: Product[]) => {
        const filteredProducts = allProducts.filter(product => product.users.includes(userId));
        return filteredProducts;
      })
    );
  }

  removeDeletedUsersFromProducts(user: User): Observable<boolean> {
    return this.getProducts().pipe(
      map((allProducts: Product[]) => {
        const filteredProducts = allProducts.filter(product => product.users.includes(user.username));
        const updatedProducts = filteredProducts.map(product => {
          product.users = product.users.filter(u => u !== user.username);
          return product;
        });
        return updatedProducts;
      }),
      mergeMap((products: Product[]) => {
        return this.batchUpdateAllProducts(products);
      }),
      mergeMap(() => {
        return of(true);
      }),
    );
  }

  private copyArray(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
        arr2[i] = arr[i];
      }
      return arr2;
    }
  }

  private getTableName(): string{
    return `customer-portal-products-${environment.stage}`;
  }
}
