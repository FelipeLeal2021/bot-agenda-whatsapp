const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./agenda.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS compromissos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      hora TEXT NOT NULL,
      descricao TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS recorrentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dia_semana TEXT NOT NULL,
      hora TEXT NOT NULL,
      descricao TEXT NOT NULL
    )
  `);
});

module.exports = db;
