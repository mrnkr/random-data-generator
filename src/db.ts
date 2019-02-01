import { Db, MongoClient } from 'mongodb';
import * as mysql from 'mysql';

export class Database {

  private _connected?: boolean;
  private _client?: MongoClient;
  private _db?: Db | mysql.Connection;

  constructor(public engine: 'mongodb' | 'mysql', private connectionString: string) { }

  public get repo(): Db | mysql.Connection | undefined {
    return this._db;
  }

  public get isConnected(): boolean {
    return !!this._connected;
  }

  public async connect(): Promise<void> {
    switch (this.engine) {

      case 'mongodb':
        return this.connectMongo();

      case 'mysql':
        return this.connectMySql();

    }
  }

  public async disconnect(): Promise<void> {
    switch (this.engine) {

      case 'mongodb':
        return this.disconnectMongo();

      case 'mysql':
        return this.disconnectMySql();

    }
  }

  private async connectMongo(): Promise<void> {
    if (this._connected) return;

    const server    = this.connectionString.substring(0, this.connectionString.lastIndexOf('/'));
    const database  = this.connectionString.split('/').pop();
    this._client    = await MongoClient.connect(server, { useNewUrlParser: true });
    this._db        = this._client.db(database);
    this._connected = true;
  }

  private async connectMySql(): Promise<void> {
    if (this._connected) return;

    // Requires: ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password'
    this._db = mysql.createConnection(this.connectionString);

    return new Promise((resolve, reject) => {
      if (!this._db)
        return reject();

      (this._db as mysql.Connection).connect((err) => {
        if (err)
          return reject(err);

        this._connected = true;
        resolve();
      });
    });
  }

  private disconnectMongo(): Promise<void> {
    if (!this._connected || !this._client)
      return Promise.resolve();
    return this._client.close();
  }

  private disconnectMySql(): void {
    if (!this._connected || !this._db)
      return;
    (this._db as mysql.Connection).destroy();
  }

}
