import Ajv from 'ajv';
import * as faker from 'faker';
import { Schema } from './schema';
import { Database } from './db';

const schema = {
  "$id": "http://example.com/schemas/schema.json",
  "type": "object",
  "properties": {
    "array": {
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
    "cache": {
      "type": "string"
    },
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
    "foreign": {
      "type": "string"
    },
    "map": {
      "type": "object",
      "properties": {
        "ids": {
          "$ref": "schema.json"
        },
        "entities": {
          "$ref": "schema.json"
        },
        "format": {
          "type": "string",
          "enum": ["simple", "detailed"]
        }
      },
      "additionalProperties": false
    },
    "pregenerate": {
      "$ref": "schema.json"
    }
  },
  "patternProperties": {
    "^(?!(array|cache|const|faker|foreign|map|pregenerate)$).*$": {
      "$ref": "schema.json"
    }
  }
};

export class Generator {

  private validate = new Ajv({ allErrors: true, useDefaults: true, verbose: true }).compile(schema);
  private cache: Map<string, any> = new Map();

  constructor(private db: Database) {
    // polyfill arrayElements (not available for some reason 🤷🏻‍)
    (faker as any).random['arrayElements'] = (array: any[]) =>
      array.filter(_ => faker.random.boolean());
  }

  public async generate(seed: Schema, entries: number): Promise<any[]> {
    await this.prefetchForeignValues(seed);

    if (seed.pregenerate) {
      await this.pregenerate(seed.pregenerate)
      delete seed.pregenerate;
    }

    return this._generate(seed, entries);
  }

  private methodHandlers: { [key: string]: (args: any) => any } = {
    array: ({ items, count, limit }: { items: Schema; count?: number; limit?: number }) => {
      if (!count) {
        if (!limit)
          throw new Error('No limit or count provided 😒');

        count = faker.random.number({ min: 1, max: limit - 1 });
      }

      return this._generate(items, count);
    },
    cache: (key: string) => {
      if (!this.cache.has(key))
        throw new Error('The cache does not contain the requested element 😖');

      return this.cache.get(key);
    },
    const: (value: any) => {
      return value;
    },
    faker: ({ cmd, args = [] }: { cmd: string; args?: any[] }) => {
      const [ns, m] = cmd.split('.');
      return (faker as any)[ns][m](...args);
    },
    map: ({ ids, entities, format = 'simple' }: { ids: Schema; entities: Schema; format: 'simple' | 'detailed' }) => {
      const ret: any    = {};
      const [genIds]    = this._generate(ids, 1);

      if (!('forEach' in genIds) || !('length' in genIds))
        throw new Error(`ids generated something other than an array 🙄\n
                         Generator: ${JSON.stringify(ids, null, 2)}\n
                         Generated: ${JSON.stringify(genIds, null, 2)}`);

      const genEntities = this._generate(entities, genIds.length);

      genIds.forEach((id: string | number, index: number) => ret[id] = genEntities[index]);
      return format === 'simple' ? ret : { ids: genIds, entities: ret };
    }
  };

  // TODO: Think of a better name that actually goes with the used conventions
  private _generate(seed: Schema, entries: number): any[] {
    if (!this.validate(seed))
      throw new Error(`Invalid seed =>\n${JSON.stringify(this.validate.errors)}`);

    const ret: any[] = [];

    Object
      .keys(seed)
      .forEach(key => {
        switch (key) {

          case 'array':
          case 'cache':
          case 'const':
          case 'faker':
          case 'map':
            for (let i = 0; i < entries; i++)
              ret.push(this.methodHandlers[key](seed[key]));
            break;

          default:
            while (ret.length < entries)
              ret.push({});
            for (let i = 0; i < entries; i++)
              ret[i][key] = this._generate(seed[key], 1)[0];
            break;

        }
      });

    return ret;
  }

  private async prefetchForeignValues(seed: Schema): Promise<void> {
    await Promise.all(
      Object
        .keys(seed)
        .map(async key => {
          switch (key) {

            case 'cache':
            case 'const':
            case 'faker':
              break;

            case 'array':
              if (seed.array)
                await this.prefetchForeignValues(seed.array.items);
              break;

            case 'map':
              if (seed.map) {
                await this.prefetchForeignValues(seed.map.ids);
                await this.prefetchForeignValues(seed.map.entities);
              }
              break;

            case 'foreign':
              if (seed.foreign) {
                if (!this.cache.has(seed.foreign))
                  this.cache.set(seed.foreign, await this.db.getDistinctValues(
                    seed.foreign.split('.')[0],
                    seed.foreign.split('.')[1]
                  ));

                seed.faker = {
                  cmd: 'random.arrayElement',
                  args: [this.cache.get(seed.foreign)]
                };
                delete seed.foreign;
              }
              break;

            default:
              await this.prefetchForeignValues(seed[key]);
              break;

          }
        })
    );
  }

  private pregenerate(seed: Schema): void {
    const [gen] = this._generate(seed, 1);

    Object
      .keys(gen)
      .forEach(key => this.cache.set(key, gen[key]));
  }

}
