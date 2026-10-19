const { openDb, migrate } = require('./db');
const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;

async function main() {
  const db = openDb();
  await migrate(db);
  const app = createApp(db);

  app.listen(PORT, () => {
    console.log(`Ojito MVP en http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error('Error arrancando ojito:', e);
  process.exit(1);
});
