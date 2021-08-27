import { Report } from './report';

export class Product {
  id: string;
  name: string;
  site: string;
  enabled: boolean;

  report: Report;
  users: string[];
}
