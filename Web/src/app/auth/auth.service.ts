import { Injectable } from '@angular/core';
import { Observable, PartialObserver } from 'rxjs';
import { CognitoIdentityCredentials } from 'aws-sdk';
import { AuthClass } from 'aws-amplify';
import { ICredentials } from '@aws-amplify/core';
import { AuthState } from 'aws-amplify-angular/dist/src/providers/auth.state';
import { AmplifyService } from 'aws-amplify-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  state: string;
  isSignedIn: boolean;
  isAdmin: boolean;
  user: any;
  greeting: string;
  credentials: Observable<CognitoIdentityCredentials>;
  credentialStore: CognitoIdentityCredentials;

  constructor(private amplify: AmplifyService) {
    // when auth state is changed (signin signout etc.)
    this.amplify.authStateChange$
      .subscribe((authState: AuthState) => {
        // store state information in the service, so that it can be accessed by other components later
        this.state = authState.state;
        this.isSignedIn = authState.state === 'signedIn';
        if (!authState.user) {
          this.user = null;
        } else {
          this.user = authState.user;
          const username = this.user.attributes && this.user.attributes.given_name ?
            this.user.attributes.given_name :
            this.user.username;
          this.greeting = `Hello ${username}`;

          // check user's group to see if it is an admin
          if (this.user.signInUserSession) {
            const cognitoGroups: string[] = this.user.signInUserSession.idToken.payload['cognito:groups'];
            this.isAdmin = cognitoGroups && cognitoGroups.indexOf('admin') !== -1;
          }

          this.getCredentials().subscribe(credential => this.credentialStore = credential);
        }
      });

    // when authorisation state is changed
    this.credentials = this.getCredentials();
  }

  private getCredentials(): Observable<CognitoIdentityCredentials> {
    // try to get credentials from identity pool
    const auth = this.amplify.auth() as AuthClass;

    // and convert credentials from promise to observable
    return Observable.create(observer => {

      auth.currentCredentials().then((data: ICredentials) => {
        // make sure it is credentials, not exception
        if (!data.accessKeyId) {
          observer.next(null);
          observer.complete();
          return;
        }
        const credentials = data as unknown as CognitoIdentityCredentials;
        observer.next(credentials);
        observer.complete();
      });

    });
  }
}
