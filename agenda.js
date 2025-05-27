const db = require('./db');

function adicionarCompromisso(data, hora, descricao, callback) {
  db.run(
    'INSERT INTO compromissos (data, hora, descricao) VALUES (?, ?, ?)',
    [data, hora, descricao],
    callback
  );
}

function listarCompromissosPorData(data, callback) {
  db.all(
    'SELECT * FROM compromissos WHERE data = ? ORDER BY hora ASC',
    [data],
    callback
  );
}

function adicionarRecorrente(diaSemana, hora, descricao, callback) {
  db.run(
    'INSERT INTO recorrentes (dia_semana, hora, descricao) VALUES (?, ?, ?)',
    [diaSemana.toLowerCase(), hora, descricao],
    callback
  );
}

function listarRecorrentesPorDia(diaSemana, callback) {
  db.all(
    'SELECT * FROM recorrentes WHERE dia_semana = ? ORDER BY hora ASC',
    [diaSemana.toLowerCase()],
    callback
  );
}

function removerCompromisso(data, hora, callback) {
  db.run(
    'DELETE FROM compromissos WHERE data = ? AND hora = ?',
    [data, hora],
    callback
  );
}

function removerRecorrente(diaSemana, hora, callback) {
  db.run(
    'DELETE FROM recorrentes WHERE dia_semana = ? AND hora = ?',
    [diaSemana.toLowerCase(), hora],
    callback
  );
}

module.exports = {
  adicionarCompromisso,
  listarCompromissosPorData,
  adicionarRecorrente,
  listarRecorrentesPorDia,
  removerCompromisso,
  removerRecorrente
};
