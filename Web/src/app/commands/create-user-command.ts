import { Injectable } from '@angular/core';
import * as AWS from 'aws-sdk';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { User, createUserFromCognitoObject } from '../models/user';
import { AdminCreateUserRequest } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class CreateUserCommand {

  constructor(private authService: AuthService) {
  }

  execute(user: User): Observable<User> {

    const params: AdminCreateUserRequest = {
      UserPoolId: environment.userPoolId,
      Username: user.email,
      UserAttributes: [
        {
          Name: 'custom:company',
          Value: user.company,
        },
        {
          Name: 'custom:account_manager',
          Value: user.accountManager,
        },
        {
          Name: 'custom:site',
          Value: user.site,
        },
        {
          Name: 'email',
          Value: user.email,
        },
        {
          Name: 'email_verified',
          Value: 'true',
        },
        {
          Name: 'given_name',
          Value: user.firstName,
        },
        {
          Name: 'family_name',
          Value: user.lastName,
        },
      ],
    };

    const provider = new AWS.CognitoIdentityServiceProvider({
      region: environment.region,
      accessKeyId: this.authService.credentialStore.accessKeyId,
      secretAccessKey: this.authService.credentialStore.secretAccessKey,
      sessionToken: this.authService.credentialStore.sessionToken
    });

    return Observable.create(observer => {

      provider.adminCreateUser(params, (err, data) => {
        if (err) {
          console.warn(err);
          observer.error(err);
          return;
        }

        const user = createUserFromCognitoObject(data.User)
        observer.next(user);
        observer.complete();
      });

    });
  }
}
