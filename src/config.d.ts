export interface Config {
  engine: string;
  host: string;
  port: string;
  auth: boolean;
  username?: string;
  password?: string;
  database: string;
  collection: string;
  schemaUri: string;
  entries: string;
}