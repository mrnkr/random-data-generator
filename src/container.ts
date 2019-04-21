import { createContainer, InjectionMode, asClass, asValue, AwilixContainer } from 'awilix';
import { Database } from './db';
import { Engine } from './engine';
import { Generator } from './generator';

export default async (
  engine: Engine,
  host: string,
  port: number,
  database: string,
  username: string,
  password: string
): Promise<AwilixContainer> => {
  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC
  });

  container.register({
    db: asClass(Database).singleton(),
    engine: asValue(engine),
    generator: asClass(Generator),
    host: asValue(host),
    port: asValue(port),
    database: asValue(database),
    username: asValue(username),
    password: asValue(password)
  });

  await container.cradle.db.connect();

  return container;
}
