import { asFunction, createContainer, InjectionMode, asClass, asValue, AwilixContainer } from 'awilix';
import { Api } from './api';
import { Database } from './db';
import { Generator } from './generator';

export default async (engine: 'mongodb' | 'mysql', connectionString: string): Promise<AwilixContainer> => {
  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC
  });
  
  container.register({
    api: asFunction(Api).singleton(),
    connectionString: asValue(connectionString),
    db: asClass(Database).singleton(),
    engine: asValue(engine),
    generator: asClass(Generator)
  });

  await container.cradle.db.connect();

  return container;
}
