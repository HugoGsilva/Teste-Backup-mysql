# Sistema de Backup MySQL

Sistema para testar backup e restore de banco de dados MySQL usando Docker, Node.js e mysqldump.

## 📋 O que faz

- Interface web para gerenciar dados
- Criar backups do banco de dados
- Simular perda de dados
- Restaurar dados de backups

## 🚀 Como rodar

### 1. Iniciar o projeto

```bash
docker compose up -d --build
```

### 2. Acessar a interface

Abra no navegador: **http://localhost:3000**

### 3. Parar o projeto

```bash
docker compose down
```

### 4. Resetar tudo (apagar dados e backups)

```bash
docker compose down -v
rm -rf backups/*
```

## 🔍 Acessar MySQL Interativo

### Entrar no MySQL

```bash
docker compose exec db mysql -uroot -pSecret123! test_db
```

### Comandos úteis dentro do MySQL

```sql
-- Ver todos os dados
SELECT * FROM itens;

-- Contar registros
SELECT COUNT(*) FROM itens;

-- Ver estrutura da tabela
DESCRIBE itens;

-- Sair
exit;
```

### Executar query direta (sem entrar no MySQL)

```bash
# Ver dados
docker compose exec db mysql -uroot -pSecret123! test_db -e "SELECT * FROM itens"

# Contar registros
docker compose exec db mysql -uroot -pSecret123! test_db -e "SELECT COUNT(*) FROM itens"
```

## 📁 Estrutura

```
.
├── app/              # Backend Node.js + API
├── front/            # Interface web
├── db/               # Scripts SQL
├── backups/          # Arquivos de backup (.sql)
└── docker-compose.yml
```

## 🧪 Testar backup/restore

### Via interface web (http://localhost:3000)

1. Inserir dados
2. Clicar em "Fazer Backup"
3. Clicar em "Simular Desastre"
4. Clicar em "Recuperar"

### Via PowerShell

```powershell
# Inserir dado
Invoke-WebRequest -Uri http://localhost:3000/api/item -Method POST -ContentType "application/json" -Body '{"nome":"Teste"}'

# Fazer backup
Invoke-WebRequest -Uri http://localhost:3000/api/trigger-backup -Method POST

# Deletar tudo
Invoke-WebRequest -Uri http://localhost:3000/api/delete-all -Method POST

# Restaurar
Invoke-WebRequest -Uri http://localhost:3000/api/trigger-restore -Method POST
```

## 📊 Ver logs

```bash
# Logs do backend
docker compose logs -f app

# Logs do MySQL
docker compose logs -f db

# Status dos containers
docker compose ps
```

## 🔧 Credenciais

- **Host**: db (dentro do Docker) / localhost (fora)
- **Usuário**: root
- **Senha**: Secret123!
- **Database**: test_db
- **Porta Web**: 3000

## 📦 Backups

Os backups são salvos em: `./backups/backup-YYYYMMDDHHMMSS.sql`

```bash
# Listar backups
ls -lh backups/

# Ver conteúdo de um backup
cat backups/backup-*.sql
```