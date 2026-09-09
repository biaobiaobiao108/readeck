import type { DbUserRow } from './db/index.ts';

export type AppEnv = {
  Variables: {
    user: DbUserRow;
  };
};
