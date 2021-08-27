import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { NewUserService } from './new-user.service';
import { CreateUserCommand } from 'src/app/commands/create-user-command';
import { User } from 'src/app/models/user';

export function stub<T>(): T {
  const typeAssertion = {} as T;
  for (const prop in typeAssertion) {
      if (typeAssertion.hasOwnProperty(prop)) {
          typeAssertion[prop] = undefined;
      }
  }

  return typeAssertion;
}

describe('NewUserService', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  describe('When adding a user', () => {

    it('Should enforce lower-casing of the users email address', () => {

      const createUserCommand = stub<CreateUserCommand>();
      createUserCommand.execute = (user: User) => of(user);
      const service = new NewUserService(createUserCommand);

      const result = service
        .addUser({
          company: 'readify',
          email: 'TEST@READIFY.NET',
          firstName: 'test',
          lastName: 'user',
          accountManager: 'BOB',
          site: 'A B',
          products: [],
          enabled: true,
          userCreateDate: new Date(2019, 9, 2),
          userLastModifiedDate: new Date(2019, 9, 2),
          userStatus: 'testing',
          username: 'test@readify.net'
        });

      result.subscribe(user => {
        expect(user.email).toBe('test@readify.net');
      });
    });
  });
});
