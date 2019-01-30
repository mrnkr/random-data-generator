#!/usr/bin/env node

import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';
// import shell from 'shelljs';

import { Config } from './config';
import { Database } from './db';
import { insert } from './driver';
import { generate, getForeignValues } from './generator';

const init = () => {
  console.log(
    chalk.green(
      figlet.textSync("RDG", {
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
      choices: ["mongodb", "mysql"]
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
      name: "entries",
      type: "input",
      message: "How many entries should be made?"
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
  const schema  = require(config.schemaUri);
  const connStr = `${config.engine}://${config.auth ? `${config.username}:${config.password}@` : ''}${config.host}:${config.port}/${config.database}`
  const db      = new Database(config.engine as any, connStr);
  await db.connect();

  // generate and populate
  await getForeignValues(schema, db);
  const data    = generate(schema, Number.parseInt(config.entries));
  await insert(db, config.collection, data);
  console.log(chalk.white.bgGreen.bold('Done'));

  await db.disconnect();
};

run();
