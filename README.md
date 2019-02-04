# Dummy data generator

[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]

[npm-image]:http://img.shields.io/npm/v/dummy-filler.svg
[npm-url]:https://npmjs.org/package/dummy-filler
[downloads-image]:http://img.shields.io/npm/dm/dummy-filler.svg

CLI to populate a database with dummy data table by table

### Description
CLI intended to populate databases with test data. It receives basic information it then uses to access the database (host, auth info, ...) and the shape of the data it should generate (uses the [faker](https://www.npmjs.com/package/faker) package). It fills only one collection/table at a time and it can work with foreign keys. **FOR NOW THIS ONLY WORKS WITH MONGO AND MYSQL DBs** - Planned support for firebase firestore!

### Installation
Finally the npm package is out 🙃 install it and enjoy!

```
npm i -g dummy-filler # may require sudo
dummy-filler
```

### Usage
Literally, just answer what the CLI asks and you will be good to go. Only thing you should know beforehand, make sure the path to the schema is recognizable by the CLI since I just used good ol' require to get its content. **READ THIS IF WORKING WITH MYSQL** To have the CLI authenticate correctly I had to run the following command (replace `'password'` with your own password and modify only the user you are going to use):

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
```

### Schema
Creating schemas for this is really simple, just create a .json file and find your use case among the following examples! If you think I could have explained myself better feel free to ask. Anyhow, should you need an INSTANT answer to your question you could use the JSON schema I used to validate the provided schemas which is located right at the beginning of the generator.ts file.

#### array
The array keyword is used to generate a list of random objects of any type you want. The generation of those values is done following a nested schema (the structure is recursive, yes 🙃). You can either generate a fixed number of values using the "count" keyword, just as you can generate any number of values between 1 and the one you pass as the "limit" property. Let us take a look at some examples:

##### Generate a list of exactly 5 numbers between 1 and 45

```json
{
  "numbers": {
    "array": {
      "items": {
        "faker": {
          "cmd": "random.number",
          "args": [{ "min": 1, "max": 45 }]
        }
      },
      "count": 5
    }
  }
}
```

That has an expected output of the shape: `{ "numbers": [11, 7, 26, 34, 21] }`

##### Generate a list of constant values of length anywhere between 1 and 3

```json
{
  "values": {
    "array": {
      "items": {
        "const": "constant value 🤪"
      },
      "limit": 3
    }
  }
}
```

That could output the following values randomly: `{ "values": [ "constant value 🤪" ] }` or `{ "values": [ "constant value 🤪", "constant value 🤪" ] }` or `{ "values": [ "constant value 🤪", "constant value 🤪", "constant value 🤪" ] }`.

**INITIAL IMPLEMENTATION NOTE: YOU SHOULD PROVIDE A VALUE FOR EITHER COUNT OR LIMIT, NOT PASSING ANY WILL LEAD TO TROUBLE... HAVEN'T VALIDATED THAT YET THO 🤫**

#### cache
This keyword is intended to providing the functionality of sharing a value between various fields. It is meant to be used in conjunction with the pregenerate keyword. The latter should be an object associating ids to some generated values which the CLI will then cache. The cache keyword receives a string which is to be the id of the generated value you want to set.

```json
{
  "pregenerate": {
    "hello": {
      "const": "there"
    }
  },
  "name": {
    "cache": "hello"
  }
}
```

The previous example shows a very basic (and rather nonsensical) usage of the cache. The pregenerate object specifies that the "hello" string should become the id for the constant value "there". So, when defining the "name" property as one which should take the same value as the one contained within the cache with id "hello" it will get the value "there". Hence, the expected output of this is `{ "name": "there" }`.

```json
{
  "pregenerate": {
    "colors": {
      "array": {
        "items": {
          "faker": {
            "cmd": "internet.color"
          }
        },
        "limit": 7
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
}
```

Now the previous example is a lot closer to something which could be useful. Imagine you had clothes in your database and you had two nested documents, one associating each available color with a picture (or an array of those) and another one associating those same colors with their availability (or in this case to make things a bit simpler just the name of the color). This is how you would generate the list of colors, cache it and then use it as the list of ids for both maps.

#### const
If you want all generated rows/documents to have the same value, like some boolean flag you always want to be true or you have some complex object which for some reason you don't want to have generated you can use the const keyword like so:

```json
{
  "someConstantField": {
    "const": "put any value here, be it a number, array, boolean, string or object"
  }
}
```

#### faker
Kinda self explainatory this one as to what it does amirite? 😅 This keyword is the one you use to invoke faker, to do so the API requires you to give it both the command and optionally some arguments to pass the function it's calling. The command is made up of the namespace, followed by a dot and then the method name. Here are some examples:

##### Generate a paragraph of lorem ipsum text

```json
{
  "someLoremIpsumText": {
    "faker": {
      "cmd": "lorem.paragraph"
    }
  }
}
```

That should generate an object like: `{ "someLoremIpsumText": "Lorem ipsum dolor sit amet ..." }`

##### Generate a number between 1 and 10

For this we would need to pass an argument to the function, like `faker.random.number({ min: 1, max: 10 })`. This is how I made it work:

```json
{
  "someRandomNumber": {
    "faker": {
      "cmd": "random.number",
      "args": [{ "min": 1, "max": 10 }]
    }
  }
}
```

That is expected to generate something like: `{ "someRandomNumber": 7 }`

#### foreign

This keyword receives a string formed by the name of a collection or table in your database, then a dot and lastly the name of a field those rows or documents have. It basically tells the CLI to put one of all distinct values for that specified field. Its handler just translates it to a faker call like the following:

```json
{
  "foreignField": {
    "foreign": "collection.field"
  }
}
```

The cli retrieves a list of values and turns the definition into:

```json
{
  "foreignField": {
    "faker": {
      "cmd": "random.arrayElement",
      "args": [["possible_value_1", "possible_value_2", ..., "possible_value_n"]]
    }
  }
}
```

An expected output for that would be: `{ "foreignField": "possible_value_45" }`

#### map

This keyword can generate two types of map structures, I call them simple and detailed. The simple type is just your average json object, some key-value pairs which, for those of us fond of typescript, would be defined as follows:

```typescript
interface Map<T> {
  [key: string]: T;
}
```

Anyhow, I did also want to have an implementation for maps like the ones [@ngrx/entity](https://ngrx.io/guide/entity) works with. As a matter of fact, the initial implementation only generated this kind of maps. The typescript type definition for this structure is as follows:

```typescript
interface Map<T> {
  ids: T[];
  entities: { [key: string]: T };
}
```

Self explainatory again but just in case, the ids array contains all the properties that are available in the entities object, useful to keep them in any order you may want, then the entities object can store all the associated items, even if ids repeats some values you won't be repeating any in memory, not even by accident.

I think it is worth mentioning that when defining a map the ids keyword should receive a schema that generates an array, whereas the entities keyword should get a schema to define only the individual objects which make up the map. Why is that? It just seemed logical: the number of ids determines the number of entities, therefore, generatng two separate arrays would lead to both of them having non matching lengths unless properly validated. It seemed way easier and also clearer to me to just define one as an array and the other one as an "individual generator".

To define these you do something like `{ "ids": anotherSchema, "entities": anotherSchema, "format": simple || detailed }`

##### Generate a map associating 3 hex colors to random color names (it won't do { "#FFFFFF": "white" }, it may even do { "#DC143C": "blue" } [it is actually crimson by the way])

```json
{
  "colors": {
    "map": {
      "ids": {
        "array": {
          "items": {
            "faker": {
              "cmd": "internet.color"
            }
          },
          "count": 3
        }
      },
      "entities": {
        "faker": {
          "cmd": "commerce.color"
        }
      },
      "format": "detailed"
    }
  }
}
```

Expected output: `{ "colors": { "ids": [ "#7FFFD4", "#EE82EE" ], "entities": { "#7FFFD4": "beige", "#EE82EE": "lawngreen" } } }`. **I REPEAT: THIS DOES NOT ENFORCE ANY LOGIC - ONLY THAT YOU GET DATA TO FILL YOUR DATABASE**
Expected output if format were simple: `{ "colors": { "#7FFFD4": "beige", "#EE82EE": "lawngreen" } }`

### Changelog

* 0.0.1 -> Initial implementation
* 0.0.2 -> Removed the possible keyword in favor of faker.random.arrayElement(s) - Added support for generation of regular maps and not just those like the ones in [@ngrx/entity](https://ngrx.io/guide/entity)
* 0.0.3 -> Now loads schema using the fs module and sanitizes the provided route a bit (just applies trim for now 😇) - added clear error message for when the ids schema generates anything other than an array - now pretty prints objects when it has to - updated tsconfig.json
