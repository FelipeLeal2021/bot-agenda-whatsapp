const db = require('./db');

// Adiciona um compromisso com data específica
function adicionarCompromisso(data, hora, descricao, callback) {
  db.run(
    'INSERT INTO compromissos (data, hora, descricao) VALUES (?, ?, ?)',
    [data, hora, descricao],
    callback
  );
}

// Lista compromissos normais (por data exata)
function listarCompromissosPorData(data, callback) {
  db.all(
    'SELECT * FROM compromissos WHERE data = ? ORDER BY hora ASC',
    [data],
    callback
  );
}

// Adiciona um compromisso recorrente (fixo por dia da semana)
function adicionarRecorrente(diaSemana, hora, descricao, callback) {
  db.run(
    'INSERT INTO recorrentes (dia_semana, hora, descricao) VALUES (?, ?, ?)',
    [diaSemana.toLowerCase(), hora, descricao],
    callback
  );
}

// Lista compromissos fixos de um dia da semana
function listarRecorrentesPorDia(diaSemana, callback) {
  db.all(
    'SELECT * FROM recorrentes WHERE dia_semana = ? ORDER BY hora ASC',
    [diaSemana.toLowerCase()],
    callback
  );
}

// Remove um compromisso por data e hora
function removerCompromisso(data, hora, callback) {
  db.run(
    'DELETE FROM compromissos WHERE data = ? AND hora = ?',
    [data, hora],
    callback
  );
}

// Remove um compromisso fixo por dia da semana e hora
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
