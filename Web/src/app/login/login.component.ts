import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AmplifyService } from 'aws-amplify-angular';
import { I18n } from 'aws-amplify';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  usernameAttributes = 'email';

  constructor(
    private router: Router,
    private amplifyService: AmplifyService,
    private authService: AuthService) {
  }

  ngOnInit() {
    this.amplifyService.authStateChange$
      .subscribe(() => {
        if (this.authService.isSignedIn) {
          if (this.authService.isAdmin) {
            this.router.navigate(['admin/users']);
          } else {
            this.router.navigate(['reports']);
          }
        } else {
          this.router.navigate(['/login']);
        }
      });

    this.customiseErrorMessage();
  }

  customiseErrorMessage() {
    const dict = {
      'en': {
          'User is disabled': 'Access to the Customer Portal has been disabled. Please contact contact your account manager.'
      },
    };
    I18n.putVocabularies(dict);
  }
}
