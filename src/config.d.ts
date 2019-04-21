import { Engine } from "./engine";

export interface Config {
  engine: Engine;
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
