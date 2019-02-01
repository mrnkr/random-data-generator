import * as fs from 'fs';
import { Schema } from './schema';

export function loadSchema(path: string): Promise<Schema> {
  path = path.trim();
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) 
        return reject(err);
      resolve(JSON.parse(data));
    })
  })
}
