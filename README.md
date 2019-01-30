# Random Data Generator

### Description
CLI intended to populate databases with test data. It receives basic information it then uses to access the database (host, auth info, ...) and the shape of the data it should generate (uses the [faker](https://www.npmjs.com/package/faker) package). It fills only one collection/table at a time and it can work with foreign keys. **FOR NOW THIS ONLY WORKS WITH MONGO AND MYSQL DBs** - Planned support for firebase firestore!

### Installation
This is the initial implementation so this process is not streamlined. As soon as I feel the project is a bit more advanced I will make an npm package for global installation. For now you should:

```
git clone https://github.com/mrnkr/random-data-generator.git
cd random-data-generator
npm link # May require sudo
```

### Usage
Literally, just answer what the CLI asks and you will be good to go. Only thing you should know beforehand, make sure the path to the schema is recognizable by the CLI since I just used good ol' require to get its content.

### Schema
Creating schemas for this is really simple, just create a .json file and find your use case among the following examples! If you think I could have explained myself better feel free to ask. Anyhow, should you need an INSTANT answer to your question you could use the JSON schema I used to validate the provided schemas which is located right at the beginning of the generator.ts file.

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

#### list

The list keyword is used to generate a list of random objects of any type. The generation of those values is done following a nested schema (the structure is recursive, yes 🙃). You can either generate a fixed number of values using the "count" keyword, just as you can generate any number of values between one and the one you pass as the "limit" property. Let us take a look at some examples:

##### Generate a list of 5 numbers between 1 and 45

```json
{
  "numbers": {
    "list": {
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
    "list": {
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

#### map

Misleading name, I must admit. I implemented this one just because I wanted it reeeeeeeeaalllllyyyyy bad, guess I could have implemented your average key-value pair and then complement with the list generator but weeeeellll... Here's one for the furute I guess... Anyway, for anyone that's worked with the entity framework in [@ngrx/entity](https://ngrx.io/guide/entity) this will be nice, or at least so I hope. It generates the following structure (defined in typescript):

```typescript
interface Map<T> {
  ids: T[];
  entities: { [key: string]: T };
}
```

Self explainatory again but just in case, the ids array contains all the properties that are available in the entities object, useful to keep them in any order you may want, then the entities object can store all the associated items, even if ids repeats some values you won't be repeating any in memory, not even by accident.

To generate these you do something like `{ "ids": somethingYouWouldPassTheFakerKeyword, "entities": anotherSchema, "count": howManyElementsToPut }`

##### Generate a map associating 3 hex colors to random color names (it won't do { "#FFFFFF": "white" }, it may even do { "#DC143C": "blue" } [it is actually crimson by the way])

```json
{
  "colors": {
    "map": {
      "ids": {
        "cmd": "internet.color"
      },
      "entities": {
        "faker": {
          "cmd": "commerce.color"
        }
      },
      "count": 3
    }
  }
}
```

Expected output: `{ "colors": { "ids": [ "#7FFFD4", "#EE82EE" ], "entities": { "#7FFFD4": "beige", "#EE82EE": "lawngreen" } } }`. **I REPEAT: THIS DOES NOT ENFORCE ANY LOGIC - ONLY THAT YOU GET DATA TO FILL YOUR DATABASE**

#### possible

Got a list of possible values to choose from? Use this keyword. This keyword allows you to enforce that values are unique (never uses the same value twice) and allows to get values from another collection/table in the database. Let's learn by example:

##### Generate a field containing ids from the collection/table named col_a (can repeat values)

```json
{
  "foreignKey": {
    "possible": {
      "foreign": "col_a._id"
    }
  }
}
```

##### Generate a field containing one of four values and when generating many avoid repetitions

```json
{
  "targetAudience": {
    "possible": {
      "values": ["men", "women", "boys", "girls"],
      "unique": true
    }
  }
}
```

Expected output shape: `{ "targetAudience": "women" }`.

### Changelog

* 0.0.1 -> Initial implementation
