const { openDb, migrate } = require('./db');
const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;
const db = openDb();
migrate(db);
const app = createApp(db);

app.listen(PORT, () => {
  console.log(`Ojito MVP en http://localhost:${PORT}`);
});
