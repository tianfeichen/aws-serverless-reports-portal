import { Product } from './product';

export interface User {
  company: string;
  accountManager: string;
  site: string;
  email: string;
  enabled: boolean;
  firstName: string;
  lastName: string;
  userCreateDate: Date;
  userLastModifiedDate: Date;
  userStatus: string;
  username: string;

  products: Product[];
}

export function createUserFromCognitoObject(obj: any): User {
  const user = {
    company: obj.Attributes.find(a => a.Name === 'custom:company').Value,
    accountManager: obj.Attributes.find(a => a.Name === 'custom:account_manager') ?
      obj.Attributes.find(a => a.Name === 'custom:account_manager').Value : '',
    site: obj.Attributes.find(a => a.Name === 'custom:site').Value,
    email: obj.Attributes.find(a => a.Name === 'email').Value,
    firstName: obj.Attributes.find(a => a.Name === 'given_name').Value,
    lastName: obj.Attributes.find(a => a.Name === 'family_name').Value,
    enabled: obj.Enabled,
    userCreateDate: obj.UserCreateDate,
    userLastModifiedDate: obj.UserLastModifiedDate,
    userStatus:  obj.UserStatus,
    username: obj.Username,
    products: []
  };
  return user;
}
