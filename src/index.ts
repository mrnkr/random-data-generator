#!/usr/bin/env node

import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';

import { Config } from './config';
import createContainer from './container';
import { Generator } from './generator';
import { loadSchema } from './json-reader';
import { Database } from './db';

const init = () => {
  console.log(
    chalk.green(
      figlet.textSync("DUMMY", {
        font: "Ghost",
        horizontalLayout: "default",
        verticalLayout: "default"
      })
    )
  );
}


const askQuestions: () => Promise<Config> = () => {
  const questions = [
    {
      name: "engine",
      type: "list",
      message: "What database engine are you using?",
      choices: ["mongodb", "mysql", "mariadb", "sqlite", "postgres", "mssql"]
    },
    {
      name: "host",
      type: "input",
      message: "What's its IP address?"
    },
    {
      name: "port",
      type: "input",
      message: "Enter the port"
    },
    {
      name: "auth",
      type: "confirm",
      message: "Does the connection require authentication?"
    },
    {
      name: "username",
      type: "input",
      message: "Enter your username",
      when: ({ auth }: Config) => auth
    },
    {
      name: "password",
      type: "password",
      message: "Enter your password",
      when: ({ auth }: Config) => auth
    },
    {
      name: "database",
      type: "input",
      message: "What's the name of the database?"
    },
    {
      name: "collection",
      type: "input",
      message: "What's the name of the collection/table?"
    },
    {
      name: "schemaUri",
      type: "input",
      message: "Enter the path to the schema"
    },
    {
      name: "commit",
      type: "confirm",
      message: "Commit data to your database? (say no if you're testing your schema)"
    },
    {
      name: "entries",
      type: "input",
      message: "How many entries should be made?",
      when: ({ commit }: Config) => commit
    }
  ];
  return inquirer.prompt(questions);
};

const run = async () => {
  // show script introduction
  init();

  // ask questions
  const answers = await askQuestions();
  const config  = answers;

  // prepare everything
  const container = await createContainer(
    config.engine,
    config.host,
    parseInt(config.port),
    config.database,
    config.username || '',
    config.password || ''
  );

  const db      = container.resolve('db') as Database;
  const gen     = container.resolve('generator') as Generator;
  const schema  = await loadSchema(config.schemaUri);

  // generate and populate
  const data    = await gen.generate(schema, Number.parseInt(config.entries || '1'));

  if (config.commit)
    await db.insert(config.collection, data);
  else
    console.log(`Generated: \n${JSON.stringify(data[0], null, 2)}`);

  console.log(chalk.white.bgGreen.bold('Done'));
};

run();
