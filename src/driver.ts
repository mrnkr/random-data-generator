import { Db } from 'mongodb';
import { Connection } from 'mysql';
import { Database } from './db';

export async function insert(db: Database, collection: string, data: any[]): Promise<void> {
  if (!db.isConnected)
    return;

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
        const query = `INSERT INTO \`${collection}\` (${Object.keys(data[0])}) VALUES ${data.map(row => `(${Object.keys(row).map(key => `\`${row[key]}\``)})`)}`;
        return new Promise((resolve, reject) => {
          ref.query(query, err => {
            if (err)
              return reject();
            return resolve();
          });
        });
      }

  }
}
