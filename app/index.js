const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { execFile } = require('child_process');

const execFileAsync = promisify(execFile);
const fsp = fs.promises;

const app = express();
app.use(express.json());

const DB_HOST = process.env.DB_HOST || 'db';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_DATABASE = process.env.DB_DATABASE || process.env.DB_NAME || 'test';
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, 'backups');
const BACKUP_BUFFER = Number(process.env.BACKUP_BUFFER || 64 * 1024 * 1024);

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10
});

async function ensureSchema() {
  const createSql = `
    CREATE TABLE IF NOT EXISTS itens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL
    )
  `;
  await pool.query(createSql);
  console.log('Tabela itens verificada/criada');
}

async function ensureBackupDir() {
  await fsp.mkdir(BACKUP_DIR, { recursive: true });
}

function buildMysqlArgs(includeDatabase = false) {
  const args = ['-h', DB_HOST, '-u', DB_USER];
  if (DB_PASSWORD) {
    args.push(`-p${DB_PASSWORD}`);
  }
  if (includeDatabase) {
    args.push(DB_DATABASE);
  }
  return args;
}

function buildDumpArgs() {
  return [...buildMysqlArgs(false), '--skip-ssl', '--single-transaction', '--quick', '--hex-blob', DB_DATABASE];
}

async function listBackups() {
  try {
    const files = await fsp.readdir(BACKUP_DIR);
    const entries = await Promise.all(
      files
        .filter((file) => file.endsWith('.sql'))
        .map(async (file) => {
          const full = path.join(BACKUP_DIR, file);
          const stat = await fsp.stat(full);
          return { file, full, mtime: stat.mtimeMs };
        })
    );
    return entries.sort((a, b) => b.mtime - a.mtime);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

async function runRestoreFrom(sqlFile) {
  const mysqlArgs = [...buildMysqlArgs(true), '--skip-ssl', '-e', `SOURCE ${sqlFile}`];
  await execFileAsync('mysql', mysqlArgs, { maxBuffer: BACKUP_BUFFER });
}

app.get('/api/itens', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM itens');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/itens error:', err);
    res.status(500).json({ error: 'Erro ao obter itens' });
  }
});

app.post('/api/item', async (req, res) => {
  try {
    const nome = req.body && req.body.nome;
    if (!nome || String(nome).trim() === '') {
      return res.status(400).json({ error: 'Campo "nome" é obrigatório' });
    }
    const [result] = await pool.execute('INSERT INTO itens (nome) VALUES (?)', [String(nome).trim()]);
    res.status(201).json({ insertedId: result.insertId });
  } catch (err) {
    console.error('POST /api/item error:', err);
    res.status(500).json({ error: 'Erro ao inserir item' });
  }
});

app.post('/api/delete-all', async (req, res) => {
  try {
    await pool.query('TRUNCATE TABLE itens');
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/delete-all error:', err);
    res.status(500).json({ error: 'Erro ao deletar todos os itens' });
  }
});

app.get('/api/backups', async (req, res) => {
  try {
    await ensureBackupDir();
    const backups = await listBackups();
    res.json(
      backups.map(({ file, mtime }) => ({
        file,
        modifiedAt: new Date(mtime).toISOString()
      }))
    );
  } catch (err) {
    console.error('GET /api/backups error:', err);
    res.status(500).json({ error: 'Erro ao listar backups' });
  }
});

app.post('/api/trigger-backup', async (req, res) => {
  try {
    await ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const filename = `backup-${timestamp}.sql`;
    const destination = path.join(BACKUP_DIR, filename);
    const dumpArgs = buildDumpArgs();

    const { stdout } = await execFileAsync('mysqldump', dumpArgs, { maxBuffer: BACKUP_BUFFER });
    await fsp.writeFile(destination, stdout, 'utf8');
    console.log(`Backup salvo em ${destination}`);
    res.json({ ok: true, file: filename });
  } catch (err) {
    console.error('POST /api/trigger-backup error:', err);
    res
      .status(500)
      .json({ error: 'Erro ao gerar backup', detail: (err.stderr && err.stderr.trim()) || err.message || String(err) });
  }
});

app.post('/api/trigger-restore', async (req, res) => {
  try {
    await ensureBackupDir();
    const backups = await listBackups();
    if (!backups.length) {
      return res.status(404).json({ error: 'Nenhum backup disponível' });
    }
    const latest = backups[0];
    await runRestoreFrom(latest.full);
    console.log(`Backup restaurado de ${latest.full}`);
    res.json({ ok: true, file: latest.file });
  } catch (err) {
    console.error('POST /api/trigger-restore error:', err);
    res
      .status(500)
      .json({ error: 'Erro ao restaurar backup', detail: (err.stderr && err.stderr.trim()) || err.message || String(err) });
  }
});

// health endpoint para checagem do container/app
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'error', message: (err && err.message) || String(err) });
  }
});

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, {
  maxAge: '1h',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Set proper MIME types
    if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
    // Set caching headers
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
}));

// espera o DB ficar pronto antes de iniciar o servidor
async function waitForDb(retries = 15, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('DB conectado');
      return;
    } catch (err) {
      console.log(`DB ainda não disponível (tentativa ${i + 1}/${retries})...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Timeout ao aguardar banco de dados');
}

const PORT = process.env.PORT || 3000;
(async () => {
  try {
    await ensureBackupDir();
    await waitForDb();
    await ensureSchema();
    app.listen(PORT, () => {
      console.log(`App listening on port ${PORT} (DB: ${DB_DATABASE} at ${DB_HOST})`);
    });
  } catch (err) {
    console.error('Falha ao iniciar aplicação:', err);
    process.exit(1);
  }
})();
