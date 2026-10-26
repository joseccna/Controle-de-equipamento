import * as SQLite from 'expo-sqlite';
import BancoDadosError from '../errors/BancoDadosError';

const NOME_BANCO = 'manutencao_equipamentos.db';
const VERSAO_BANCO = 1;

// Os CHECK no banco são uma segunda camada de proteção: mesmo que algum código
// pule a validação das classes, o SQLite recusa dados inválidos.
const CRIAR_TABELAS = `
  CREATE TABLE IF NOT EXISTS equipamentos (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    nome              TEXT NOT NULL,
    codigo_patrimonio TEXT NOT NULL UNIQUE,
    categoria         TEXT NOT NULL,
    marca             TEXT,
    modelo            TEXT,
    localizacao       TEXT,
    data_aquisicao    TEXT,
    status            TEXT NOT NULL DEFAULT 'Ativo'
                      CHECK (status IN ('Ativo', 'Em manutenção', 'Inativo')),
    criado_em         TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS manutencoes (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    equipamento_id     INTEGER NOT NULL REFERENCES equipamentos(id) ON DELETE CASCADE,
    tipo               TEXT NOT NULL CHECK (tipo IN ('Preventiva', 'Corretiva')),
    descricao          TEXT NOT NULL,
    tecnico            TEXT NOT NULL,
    data_abertura      TEXT NOT NULL,
    data_prevista      TEXT,
    data_conclusao     TEXT,
    custo              REAL NOT NULL DEFAULT 0 CHECK (custo >= 0),
    status             TEXT NOT NULL DEFAULT 'Pendente'
                       CHECK (status IN ('Pendente', 'Em andamento', 'Concluída', 'Cancelada')),
    periodicidade_dias INTEGER,
    criado_em          TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_manutencoes_equipamento ON manutencoes (equipamento_id);
  CREATE INDEX IF NOT EXISTS idx_manutencoes_status ON manutencoes (status);
`;

// Singleton: o app inteiro compartilha uma única conexão com o banco.
export default class Database {
  static #conexao = null;

  static obter() {
    if (!Database.#conexao) {
      Database.#conexao = Database.#abrir().catch((erro) => {
        Database.#conexao = null; // permite tentar de novo
        throw new BancoDadosError('Não foi possível abrir o banco de dados do aplicativo.', erro);
      });
    }
    return Database.#conexao;
  }

  static async #abrir() {
    const db = await SQLite.openDatabaseAsync(NOME_BANCO);
    // foreign_keys precisa ser ligado a cada conexão para o ON DELETE CASCADE funcionar.
    await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    await Database.#migrar(db);
    return db;
  }

  static async #migrar(db) {
    const { user_version: versaoAtual } = await db.getFirstAsync('PRAGMA user_version');
    if (versaoAtual >= VERSAO_BANCO) return;
    await db.execAsync(CRIAR_TABELAS);
    await db.execAsync(`PRAGMA user_version = ${VERSAO_BANCO}`);
  }
}
