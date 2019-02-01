export interface Config {
  engine: 'mongodb' | 'mysql';
  host: string;
  port: string;
  auth: boolean;
  username?: string;
  password?: string;
  database: string;
  collection: string;
  schemaUri: string;
  commit: boolean;
  entries?: string;
}