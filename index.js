// === index.js ===
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const moment = require('moment');
const cron = require('node-cron');
require('moment/locale/pt-br');
const {
  adicionarCompromisso,
  listarCompromissosPorData,
  adicionarRecorrente,
  listarRecorrentesPorDia,
  removerCompromisso,
  removerRecorrente
} = require('./agenda');

moment.locale('pt-br');

const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  console.log('✅ Bot conectado com sucesso!');

  cron.schedule('0 8 * * *', async () => {
    const hoje = moment().format('DD/MM/YYYY');
    const diaSemana = moment().format('dddd').split('-')[0].trim().toLowerCase();
    const chats = await client.getChats();
    const grupoAgenda = chats.find(chat => chat.isGroup && chat.name === '📅 Minha Agenda');
    if (!grupoAgenda) return;

    listarCompromissosPorData(hoje, (err, normais) => {
      listarRecorrentesPorDia(diaSemana, (err2, recorrentes) => {
        const todos = [...(normais || []), ...(recorrentes || [])];
        if (todos.length === 0) {
          grupoAgenda.sendMessage('📭 Você não tem compromissos agendados para hoje.');
        } else {
          const msg = todos.map(r => `🕒 ${r.hora} - ${r.descricao}`).join('\n');
          grupoAgenda.sendMessage(`📅 Bom dia! Aqui está sua agenda de hoje (${hoje}):\n\n${msg}`);
        }
      });
    });
  });

  cron.schedule('* * * * *', async () => {
    const agora = moment();
    const hoje = agora.format('DD/MM/YYYY');
    const diaSemana = agora.format('dddd').split('-')[0].trim().toLowerCase();
    const chats = await client.getChats();
    const grupoAgenda = chats.find(chat => chat.isGroup && chat.name === '📅 Minha Agenda');
    if (!grupoAgenda) return;

    listarCompromissosPorData(hoje, (err, normais) => {
      listarRecorrentesPorDia(diaSemana, (err2, recorrentes) => {
        const todos = [...(normais || []), ...(recorrentes || [])];
        todos.forEach(compromisso => {
          const horarioCompromisso = moment(`${hoje} ${compromisso.hora}`, 'DD/MM/YYYY HH:mm');
          const diff = horarioCompromisso.diff(agora, 'minutes');
          if (diff >= 14 && diff <= 15) {
            grupoAgenda.sendMessage(`⏰ Lembrete: Daqui a 15 minutos você tem:\n🕒 ${compromisso.hora} - ${compromisso.descricao}`);
          }
        });
      });
    });
  });
});

client.on('message_create', async (message) => {
  const chat = await message.getChat();
  if (!chat.isGroup || chat.name !== '📅 Minha Agenda') return;

  const texto = message.body.trim().toLowerCase();
  const hoje = moment().format('DD/MM/YYYY');
  const diaSemana = moment().format('dddd').split('-')[0].trim().toLowerCase();

  if (texto.startsWith('add ')) {
    const partes = texto.split(' ');
    const diaMes = partes[1];
    const hora = partes[2];
    const descricao = partes.slice(3).join(' ');

    if (!/^\d{2}\/\d{2}$/.test(diaMes)) {
      return message.reply(
        '⚠️ Formato inválido.\n\n✅ Para compromissos fixos, use:\n`addfixo segunda 21:00 Correr na rua`\n\n📅 Para compromissos de um dia específico, use:\n`add 27/05 21:00 Correr na rua`'
      );
    }

    const anoAtual = moment().format('YYYY');
    const data = `${diaMes}/${anoAtual}`;

    adicionarCompromisso(data, hora, descricao, (err) => {
      if (err) return message.reply('❌ Erro ao adicionar compromisso.');
      message.reply(`✅ Compromisso adicionado: ${data} ${hora} - ${descricao}`);
    });

  } else if (texto.startsWith('addfixo')) {
    const partes = texto.split(' ');
    const diaSemana = partes[1];
    const hora = partes[2];
    const descricao = partes.slice(3).join(' ');

    adicionarRecorrente(diaSemana, hora, descricao, (err) => {
      if (err) return message.reply('❌ Erro ao adicionar compromisso fixo.');
      message.reply(`✅ Compromisso recorrente adicionado: Toda ${diaSemana} às ${hora} - ${descricao}`);
    });

  } else if (texto.startsWith('remover ')) {
    const partes = texto.split(' ');
    const diaMes = partes[1];
    const hora = partes[2];

    if (!/^\d{2}\/\d{2}$/.test(diaMes)) {
      return message.reply('⚠️ Use o formato:\nremover 27/05 14:00');
    }

    const anoAtual = moment().format('YYYY');
    const data = `${diaMes}/${anoAtual}`;

    removerCompromisso(data, hora, (err) => {
      if (err) return message.reply('❌ Erro ao remover compromisso.');
      message.reply(`🗑 Compromisso removido de ${data} às ${hora}`);
    });

  } else if (texto.startsWith('removerfixo ')) {
    const partes = texto.split(' ');
    const diaSemana = partes[1];
    const hora = partes[2];

    removerRecorrente(diaSemana, hora, (err) => {
      if (err) return message.reply('❌ Erro ao remover compromisso fixo.');
      message.reply(`🗑 Compromisso fixo removido: Toda ${diaSemana} às ${hora}`);
    });

  } else if (texto === 'semana') {
    let resposta = '';
    for (let i = 0; i < 7; i++) {
      const data = moment().add(i, 'days');
      const dataFormatada = data.format('DD/MM/YYYY');
      const nomeDia = data.format('dddd').split('-')[0].trim().toLowerCase();

      const compromissosNormais = await new Promise(resolve =>
        listarCompromissosPorData(dataFormatada, (err, rows) => resolve(rows || []))
      );

      const compromissosFixos = await new Promise(resolve =>
        listarRecorrentesPorDia(nomeDia, (err, rows) => resolve(rows || []))
      );

      const todos = [...compromissosNormais, ...compromissosFixos];
      if (todos.length > 0) {
        resposta += `📆 ${data.format('dddd')} (${dataFormatada})\n`;
        todos.sort((a, b) => a.hora.localeCompare(b.hora));
        todos.forEach(c => {
          resposta += `🕒 ${c.hora} - ${c.descricao}\n`;
        });
        resposta += '\n';
      }
    }

    if (!resposta) {
      message.reply('📭 Nenhum compromisso para os próximos 7 dias.');
    } else {
      message.reply(resposta.trim());
    }

  } else if (texto === 'ajuda') {
    message.reply(
      `📚 *Comandos disponíveis:*\n\n` +
      `✅ *Adicionar:*\n` +
      `add 27/05 14:00 Descrição\n` +
      `addfixo segunda 19:00 Descrição\n\n` +
      `🗑 *Remover:*\n` +
      `remover 27/05 14:00\n` +
      `removerfixo segunda 19:00\n\n` +
      `📅 *Ver Agenda:*\n` +
      `hoje\nagenda\nsemana\n\n` +
      `ℹ️ *Ajuda:*\n` +
      `ajuda`
    );

  } else if (texto === 'hoje' || texto === 'agenda') {
    listarCompromissosPorData(hoje, (err, normais) => {
      listarRecorrentesPorDia(diaSemana, (err2, recorrentes) => {
        const todos = [...(normais || []), ...(recorrentes || [])];

        if (todos.length === 0) {
          message.reply('📭 Você não tem compromissos hoje.');
        } else {
          const msg = todos.map(r => `🕒 ${r.hora} - ${r.descricao}`).join('\n');
          message.reply(`📅 Sua agenda de hoje:\n\n${msg}`);
        }
      });
    });
  }
});

client.initialize();
