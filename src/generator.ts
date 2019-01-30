import Ajv from 'ajv';
import * as faker from 'faker';
import { Db } from 'mongodb';
import { Connection } from 'mysql';
import { Database } from './db';

const schema = {
  "$id": "http://example.com/schemas/schema.json",
  "type": "object",
  "properties": {
    "const": {
      "type": ["number", "boolean", "string", "array", "object"]
    },
    "faker": {
      "type": "object",
      "required": ["cmd"],
      "properties": {
        "cmd": {
          "type": "string"
        },
        "args": {
          "type": "array"
        }
      },
      "additionalProperties": false
    },
    "list": {
      "type": "object",
      "properties": {
        "items": {
          "$ref": "schema.json"
        },
        "count": {
          "type": "integer"
        },
        "limit": {
          "type": "integer"
        }
      },
      "additionalProperties": false
    },
    "map": {
      "type": "object",
      "properties": {
        "ids": {
          "type": "object",
          "required": ["cmd"],
          "properties": {
            "cmd": {
              "type": "string"
            },
            "args": {
              "type": "array"
            }
          },
          "additionalProperties": false
        },
        "entities": {
          "$ref": "schema.json"
        },
        "count": {
          "type": "integer"
        }
      },
      "additionalProperties": false
    },
    "possible": {
      "type": "object",
      "properties": {
        "values": {
          "type": "array",
          "items": {
            "type": ["number", "boolean", "string", "array", "object"]
          }
        },
        "unique": {
          "type": "boolean"
        },
        "foreign": {
          "type": "string"
        }
      }
    }
  },
  "patternProperties": {
    "^(?!(const|faker|list|map|possible)$).*$": {
      "$ref": "schema.json"
    }
  }
};

export function generate(seed: any, entries: number, db?: Database) {
  const isValid = new Ajv({ allErrors: true, verbose: true, useDefaults: true }).compile(schema);

  if (!isValid(seed))
    throw new Error(JSON.stringify(isValid.errors));

  const ret: any[] = [];

  if ('faker' in seed) {
    const [ns, m] = seed.faker.cmd.split('.');
    for (let i = 0; i < entries; i++)
      ret.push(ns === 'date' ? ((faker as any)[ns][m](...seed.faker.args) as Date).toISOString() : (faker as any)[ns][m](...seed.faker.args));
  } else if ('const' in seed) {
    for (let i = 0; i < entries; i++)
      ret.push(seed.const);
  } else if ('possible' in seed) {
    const values = [...seed.possible.values];
    for (let i = 0; i < entries; i++) {
      const index = faker.random.number({ min: 0, max: values.length - 1 });
      ret.push(values[index]);
      if (seed.possible.unique) values.splice(index, 1);
    }
  } else if ('list' in seed) {
    const { count = faker.random.number({ min: 1, max: seed.list.limit - 1 }) } = seed.list;
    for (let i = 0; i < entries; i++)
      ret.push(generate(seed.list.items, count));
  } else if ('map' in seed) {
    for (let i = 0; i < entries; i++) {
      const ids: string[] = [];
      const [ns, m] = seed.map.ids.split('.');
      const { count = faker.random.number() } = seed.map;
      for (let i = 0; i < count; i++)
        ids.push((faker as any)[ns][m]());
      const entities = generate(seed.map.entities, count);
      const map: any = { ids, entities: {} };
      ids.forEach((id, index) => map.entities[id] = entities[index]);
      ret.push(map);
    }
  } else {
    for (let i = 0; i < entries; i++)
      ret.push({});

    Object.keys(seed).forEach(key => {
      for (let i = 0; i < entries; i++)
        ret[i][key] = generate(seed[key], 1)[0];
    });
  }

  return ret;
}

export async function getForeignValues(seed: any, db: Database) {
  const cache = new Map<string, any>();

  await Promise.all(Object
    .keys(seed)
    .filter(key => ['const', 'faker'].indexOf(key) === -1)
    .map(async key => {
      switch (key) {

        case 'list':
          await getForeignValues(seed[key].items, db);
          break;

        case 'map':
          await getForeignValues(seed[key].entities, db);
          break;

        case 'possible':
          if (seed[key].foreign) {
            if (cache.has(seed[key].foreign)) {
              seed[key].values = cache.get(seed[key].foreign);
              break;
            }

            const [ collection, field ] = seed[key].foreign.split('.');
            
            switch (db.engine) {

              case 'mongodb':
                seed[key].values = (await (db.repo as Db)
                  .collection(collection)
                  .distinct(field, {})).map((item: any) => {
                    if ('toHexString' in item) {
                      return item.toHexString();
                    }

                    return item;
                  });
                break;

              case 'mysql':
                const query = new Promise((resolve, reject) => {
                  (db.repo as Connection).query(`select unique \`${field}\` from \`${collection}\``, (err, values) => {
                    if (err)
                      return reject(err);
                    resolve(values);
                  });
                });

                seed[key].values = await query;
                break;

            }

            cache.set(key, seed[key].values);
            break;

          }
    
          default:
            await getForeignValues(seed[key], db);
            break;
        
      }
    }));
}
