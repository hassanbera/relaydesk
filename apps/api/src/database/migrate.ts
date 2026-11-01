import { dataSource } from "./data-source";
async function run() {
  await dataSource.initialize();
  try {
    const migrations = await dataSource.runMigrations({ transaction: "all" });
    console.log(`Applied ${migrations.length} migration(s).`);
  } finally {
    await dataSource.destroy();
  }
}
run().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
