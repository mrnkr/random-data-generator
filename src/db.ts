import { MongoClient } from 'mongodb';
import { Sequelize } from 'sequelize';
import { Engine } from './engine';

export class Database {

  private _connected?: boolean;
  private _client?: MongoClient;
  private _sequelize?: Sequelize;

  constructor(
    private engine: Engine,
    private host: string,
    private port: number,
    private database: string,
    private username: string,
    private password: string
  ) { }

  public get isConnected(): boolean {
    return !!this._connected;
  }

  public async connect(): Promise<void> {
    switch (this.engine) {

      case 'mongodb':
        return this.connectMongo();

      default:
        return this.connectSql();

    }
  }

  public async getDistinctValues(tableOrCollection: string, field: string): Promise<any[]> {
    switch (this.engine) {
      case 'mongodb':
        return (await this._client!
          .db(this.database)
          .collection(tableOrCollection)
          .distinct(field, {}))
          .map((item: any) => {
            if ('toHexString' in item) {
              return item.toHexString();
            }

            return item;
          });
        default:
          const [ result ] = await this._sequelize!
            .query(`select distinct ${this.tableQuote}${field}${this.tableQuote} from ${this.tableQuote}${tableOrCollection}${this.tableQuote}`);
          return result.map((y: any) => y[field]);
    }
  }

  public async insert(tableOrCollection: string, data: any[]): Promise<void> {
    switch (this.engine) {
      case 'mongodb':
        await this._client!
          .db(this.database)
          .collection(tableOrCollection)
          .insertMany(data);
        break;
      default:
        const query = `insert into ${this.tableQuote}${tableOrCollection}${this.tableQuote} (${Object.keys(data[0])})
          values ${data.map(row =>
            `(${Object.keys(row).map(key => `${typeof row[key] === 'string' ? `${this.valueQuote}${row[key]}${this.valueQuote}` : row[key]}`)})`)}`;
        await this._sequelize!
          .query(query);
        break;
    }
  }

  public async disconnect(): Promise<void> {
    switch (this.engine) {

      case 'mongodb':
        return this.disconnectMongo();

      default:
        return this.disconnectSql();

    }
  }

  private get tableQuote(): string {
    switch (this.engine) {
      case 'postgres':
        return '\"';
      case 'mysql':
      case 'mariadb':
        return '\`';
      default:
        return '';
    }
  }

  private get valueQuote(): string {
    switch (this.engine) {
      case 'mssql':
      case 'postgres':
        return '\'';
      case 'mysql':
      case 'mariadb':
        return '\"';
      default:
        return '\"';
    }
  }

  private async connectMongo(): Promise<void> {
    if (this._connected) return;

    this._client    = await MongoClient.connect(
      `mongodb://${this.username && this.password ? `${this.username}:${this.password}@` : ''}${this.host}:${this.port}`,
      { useNewUrlParser: true }
    );
    this._connected = true;
  }

  private async connectSql(): Promise<void> {
    if (this._connected) return;

    this._sequelize = new Sequelize({
      host: this.host,
      port: this.port,
      database: this.database,
      dialect: this.engine as any,
      username: this.username,
      password: this.password
    });

    this._connected = true;
  }

  private disconnectMongo(): Promise<void> {
    if (!this._connected || !this._client)
      return Promise.resolve();
    this._connected = false;
    return this._client.close();
  }

  private async disconnectSql(): Promise<void> {
    this._connected = false;
  }

}
