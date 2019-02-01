import { Generator } from '../src/generator';
import { Schema } from '../src/schema';

const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const gen = new Generator({
  getForeignValues: () => (["hello", "there", "general", "kenobi"])
} as any);

describe('Generator tests', () => {

  it('should have a module', () => {
    expect(Generator).toBeDefined();
  })

  describe('array', () => {

    it('should generate an array of 10 random items at most', async () => {
      const schema: Schema = {
        "people": {
          "array": {
            "items": {
              "faker": {
                "cmd": "name.findName"
              }
            },
            "limit": 10
          }
        }
      };

      const [{ people }] = await gen.generate(schema, 1);
      expect('length' in people).toBeTruthy();
      expect(people.length).toBeLessThan(10);
      expect(typeof people[0]).toEqual('string');
    })

  })

  describe('const', () => {

    it('should generate an array filled with falses', async () => {
      const schema: Schema = {
        "iSaidNo": {
          "array": {
            "items": {
              "const": false
            },
            "limit": 3
          }
        }
      };

      const [{ iSaidNo }] = await gen.generate(schema, 1);
      expect(iSaidNo.every((item: boolean) => !item)).toBeTruthy();
    })

  })

  describe('faker', () => {

    it('should create shallow object following provided schema', async () => {
      const schema: Schema = {
        "name": {
          "faker": {
            "cmd": "name.findName"
          }
        },
        "email": {
          "faker": {
            "cmd": "internet.email"
          }
        },
        "password": {
          "faker": {
            "cmd": "internet.password"
          }
        },
        "gender": {
          "faker": {
            "cmd": "random.arrayElement",
            "args": [["male", "female"]]
          }
        }
      };

      const [generated] = await gen.generate(schema, 1);
      expect(typeof generated.name).toEqual('string');
      expect(generated.email).toMatch(EMAIL_REGEX);
      expect(generated.password).toBeDefined();
      expect(generated.gender).toMatch(/^(male|female)$/)
    })

  })

  describe('foreign key', () => {
    
    it('should use value from foreign key to populate field', async () => {
      const schema: Schema = {
        "word": {
          "foreign": "collection.field"
        }
      };

      const [{ word }] = await gen.generate(schema, 1);
      expect(word).toMatch(/^(hello|there|general|kenobi)$/);
    })

    it('should use value from foreign key to populate map', async () => {
      const schema: Schema = {
        "iFindYourLackOfFaithDisturbing": {
          "map": {
            "ids": {
              "array": {
                "items": {
                  "faker": {
                    "cmd": "internet.color"
                  }
                },
                "limit": 3
              }
            },
            "entities": {
              "foreign": "collection.field"
            },
            "format": "simple"
          }
        }
      }

      const [{ iFindYourLackOfFaithDisturbing }] = await gen.generate(schema, 1);
      expect(
        Object
          .keys(iFindYourLackOfFaithDisturbing)
          .every(key => /^(hello|there|general|kenobi)$/.test(iFindYourLackOfFaithDisturbing[key]))
      ).toBeTruthy();
    })

    it('should use values from foreign key to populate array', async () => {
      const schema: Schema = {
        "rebelionsAreBuiltOnHope": {
          "array": {
            "items": {
              "foreign": "collection.field"
            },
            "limit": 2
          }
        }
      };

      const [{ rebelionsAreBuiltOnHope }] = await gen.generate(schema, 1);
      expect(
        rebelionsAreBuiltOnHope.every((item: any) => /^(hello|there|general|kenobi)$/.test(item))
      ).toBeTruthy();
    })

  })

  describe('map', () => {

    it('should generate two different maps with the same ids', async () => {
      const schema: Schema = {
        "pregenerate": {
          "colors": {
            "array": {
              "items": {
                "faker": {
                  "cmd": "internet.color"
                }
              },
              "limit": 6
            }
          }
        },
        "pictures": {
          "map": {
            "ids": {
              "cache": "colors"
            },
            "entities": {
              "faker": {
                "cmd": "image.imageUrl"
              }
            },
            "format": "detailed"
          }
        },
        "colors": {
          "map": {
            "ids": {
              "cache": "colors"
            },
            "entities": {
              "faker": {
                "cmd": "commerce.color"
              }
            },
            "format": "detailed"
          }
        }
      };

      const [{ pictures, colors }] = await gen.generate(schema, 1);
      expect(pictures.ids).toEqual(colors.ids);
      expect(Object.keys(pictures.entities).length).toEqual(pictures.ids.length);
      expect(Object.keys(colors.entities).length).toEqual(colors.ids.length);
    })

    it('should generate the same map twice but in different formats', async () => {
      const schema: Schema = {
        "pregenerate": {
          "colors": {
            "array": {
              "items": {
                "faker": {
                  "cmd": "internet.color"
                }
              },
              "limit": 6
            }
          }
        },
        "simple": {
          "map": {
            "ids": {
              "cache": "colors"
            },
            "entities": {
              "faker": {
                "cmd": "image.imageUrl"
              }
            },
            "format": "simple"
          }
        },
        "detailed": {
          "map": {
            "ids": {
              "cache": "colors"
            },
            "entities": {
              "faker": {
                "cmd": "image.imageUrl"
              }
            },
            "format": "detailed"
          }
        }
      };

      const [{ simple, detailed }] = await gen.generate(schema, 1);
      expect(Object.keys(simple)).toEqual(detailed.ids);
      expect(simple).toEqual(detailed.entities);
    })
  
  })

  describe('pregenerate values', () => {

    it('should generate { name: \'there\' } using pregenerated values', async () => {
      const schema: Schema = {
        "pregenerate": {
          "hello": {
            "const": "there"
          }
        },
        "name": {
          "cache": "hello"
        }
      };

      const [{ name }] = await gen.generate(schema, 1);
      expect(name).toEqual('there');
    })

  })

})
