import { Injectable } from '@angular/core';
import { Observable, of, zip } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import * as AWS from 'aws-sdk';
import { AWSError } from 'aws-sdk';
import { ListUsersRequest, AdminEnableUserRequest, AdminDeleteUserRequest } from 'aws-sdk/clients/cognitoidentityserviceprovider';

import { User, createUserFromCognitoObject } from 'src/app/models/user';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/auth/auth.service';
import { Product } from 'src/app/models/product';
import { ProductsService } from '../products/products.service';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  provider: Observable<AWS.CognitoIdentityServiceProvider>;

  constructor(
    private authService: AuthService,
    private productsService: ProductsService) {

    this.provider = this.authService.credentials.pipe(
      mergeMap(credentials => {
        const provider = new AWS.CognitoIdentityServiceProvider({
          region: environment.region,
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken
        });
        return of(provider);
      })
    );
  }

  private listUsers(): Observable<User[]> {
    return Observable.create(observer => {

      this.provider.subscribe(provider => {
        this.listUsersRecursively(provider, [], null, (err, data) => {
          if (err) {
            console.warn(err);
            observer.error(err);
            return;
          }
          observer.next(data);
          observer.complete();
        });
      });

    });
  }

  private listUsersRecursively(
    provider: AWS.CognitoIdentityServiceProvider, users: User[], paginationToken: string,
    callback?: (err: AWSError, data: User[]) => void) {

    const params: ListUsersRequest = {
      UserPoolId: environment.userPoolId,
      Limit: 60,
      PaginationToken: paginationToken
    };

    provider.listUsers(params, (err, data) => {
      const currBatchUsers = data.Users.map(u => createUserFromCognitoObject(u));
      const allUsers = users.concat(currBatchUsers);

      if (!data.PaginationToken) {
        return callback(err, allUsers);
      } else {
        return this.listUsersRecursively(provider, allUsers, data.PaginationToken, callback);
      }
    });
  }

  toggleUserEnabled(user: User, enabled: boolean): Observable<boolean> {
    const params: AdminEnableUserRequest = {
      UserPoolId: environment.userPoolId,
      Username: user.username
    };

    return Observable.create(observer => {

      this.provider.subscribe(provider => {
        if (enabled) {
          provider.adminEnableUser(params, (err, data) => {
            observer.next(err == null)
            observer.complete();
          });
        } else {
          provider.adminDisableUser(params, (err, data) => {
            observer.next(err == null)
            observer.complete();
          });
        }
      });

    });
  }

  getUsers(): Observable<User[]> {
    // first load both users and products
    const usersObservable = this.listUsers();
    const productsObservable = this.productsService.getProducts();

    // for each user, loop through reports and see if they are in reports' users property
    return zip(usersObservable, productsObservable).pipe(
      mergeMap(responses => {
        const users: User[] = responses[0];
        const products: Product[] = responses[1];

        users.forEach((user: User) => {
          const matchedProducts = this.getUserProducts(user, products);
          user.products = matchedProducts;
        });

        return of(users);
      })
    );

  }

  private getUserProducts(user: User, allProducts: Product[]) {
    const matchedProducts = allProducts.map((product: Product) => {
      if (product.users.find(u => u === user.username)) {
        return product;
      }
    }).filter(Boolean);
    return matchedProducts;
  }

  deleteUser(user: User): Observable<boolean> {
    const params: AdminDeleteUserRequest = {
      UserPoolId: environment.userPoolId,
      Username: user.username
    };

    return Observable.create(observer => {

      this.provider.subscribe(provider => {
          provider.adminDeleteUser(params, (err, data) => {
            observer.next(err == null);
            observer.complete();
          });
      });

    });
  }

}
