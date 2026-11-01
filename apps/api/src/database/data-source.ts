import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config";
import { entities } from "../model/entities";
import { Initial1800000000000 } from "./migrations/1800000000000-initial";
export const dataSource = new DataSource({
  type: "postgres",
  url: env.DATABASE_URL,
  entities,
  migrations: [Initial1800000000000],
  synchronize: false,
  logging: false,
  extra: { max: 12 },
  invalidWhereValuesBehavior: { null: "throw", undefined: "throw" },
});
