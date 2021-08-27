import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { User } from 'src/app/models/user';
import { CreateUserCommand } from 'src/app/commands/create-user-command';

@Injectable({
  providedIn: 'root'
})
export class NewUserService {

  constructor(private createUserCommand: CreateUserCommand) {
  }

  addUser(user: User): Observable<User> {
    user.email = user.email.toLowerCase();
    return this.createUserCommand.execute(user);
  }
}
