import { Db } from 'mongodb';
import { Connection } from 'mysql';
import { Database } from './db';

export interface Api {
  getForeignValues: (seed: string) => Promise<any[]>;
  insert: (collection: string, data: any[]) => Promise<void>;
}

export const Api = (db: Database): Api => ({
  getForeignValues: async (seed: string) => {
    if (!db.isConnected)
      throw new Error('Not connected to the database 🥺');
    
    if (db.repo) {
      const [ collection, field ] = seed.split('.');
      
      switch (db.engine) {

        case 'mongodb':
          return (await (db.repo as Db)
            .collection(collection)
            .distinct(field, {}))
            .map((item: any) => {
              if ('toHexString' in item) {
                return item.toHexString();
              }

              return item;
            });

        case 'mysql':
          return new Promise((resolve, reject) => {
            (db.repo as Connection).query(`select unique \`${field}\` from \`${collection}\``, (err, values) => {
              if (err)
                return reject(err);
              resolve(values);
            });
          });

        default:
          return;

      }

    }
  },
  insert: async (collection: string, data: any[]) => {
    if (!db.isConnected)
      throw new Error('Database disconnected 🧐');
  
    switch (db.engine) {
  
      case 'mongodb':
      {
        const ref = (db.repo as Db);
        ref.collection(collection).insertMany(data);
        return;
      }
  
      case 'mysql':
        {
          const ref   = (db.repo as Connection);
          const query = `insert into \`${collection}\` (${Object.keys(data[0])}) 
            values ${data.map(row => 
              `(${Object.keys(row).map(key => `${typeof row[key] === 'string' ? `\"${row[key]}\"` : row[key]}`)})`)}`;
          return new Promise((resolve, reject) => {
            ref.query(query, err => {
              if (err)
                return reject();
              resolve();
            });
          });
        }
  
    }
  }
})