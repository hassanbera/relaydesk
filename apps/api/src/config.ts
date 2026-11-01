import { config } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";
config({ path: resolve(__dirname, "../../../.env"), quiet: true });
export const env = z
  .object({
    DATABASE_URL: z
      .string()
      .url()
      .default(
        "postgresql://relaydesk:local_development_only@127.0.0.1:55520/relaydesk",
      ),
    PORT: z.coerce.number().int().min(1).max(65535).default(4401),
    HOST: z.string().default("127.0.0.1"),
    PUBLIC_ORIGIN: z.string().url().default("http://127.0.0.1:5501"),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  })
  .parse(process.env);
