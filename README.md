# Sistema de Backup MySQL

Sistema para testar backup e restore de banco de dados MySQL usando Docker, Node.js e mysqldump com **backup automático** e **relógio de Brasília**.

## 📋 O que faz

- Interface web moderna com relógio em tempo real (horário de Brasília)
- **Backup automático** configurável por segundos
- Criar backups manuais do banco de dados
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

## ⚙️ Backup Automático

### Como usar

1. Acesse a interface web (http://localhost:3000)
2. Na seção "Backup Automático", defina o segundo desejado (0-59)
3. Clique em "Ativar Backup Automático"
4. O sistema executará backup automaticamente quando o relógio atingir o segundo configurado

### Exemplo

- Configurar para **segundo 30**
- O backup será executado automaticamente a cada minuto aos **30 segundos**
- Exemplos de horários: 01:24:30, 01:25:30, 01:26:30, etc.

### Recursos

- **Relógio em tempo real** mostrando horário de Brasília (UTC-3)
- **Indicador visual** de status (ativo/inativo)
- **Contador regressivo** mostrando segundos até o próximo backup
- Alertas visuais quando o backup está próximo (últimos 5 segundos)

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
├── front/            # Interface web moderna
├── db/               # Scripts SQL
├── backups/          # Arquivos de backup (.sql)
└── docker-compose.yml
```

## 🧪 Testar backup/restore

### Via interface web (http://localhost:3000)

1. Inserir dados
2. Clicar em "Fazer Backup" (ou ativar backup automático)
3. Clicar em "Simular Desastre"
4. Clicar em "Recuperar"

### Via PowerShell

```powershell
# Inserir dado
Invoke-WebRequest -Uri http://localhost:3000/api/item -Method POST -ContentType "application/json" -Body '{"nome":"Teste"}'

# Fazer backup manual
Invoke-WebRequest -Uri http://localhost:3000/api/trigger-backup -Method POST

# Configurar backup automático (ativar aos 30 segundos)
Invoke-WebRequest -Uri http://localhost:3000/api/configure-auto-backup -Method POST -ContentType "application/json" -Body '{"enabled":true,"triggerSecond":30}'

# Verificar configuração do backup automático
Invoke-WebRequest -Uri http://localhost:3000/api/auto-backup-config

# Deletar tudo
Invoke-WebRequest -Uri http://localhost:3000/api/delete-all -Method POST

# Restaurar
Invoke-WebRequest -Uri http://localhost:3000/api/trigger-restore -Method POST
```

## 📊 Ver logs

```bash
# Logs do backend (para ver execução dos backups automáticos)
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

Os backups são salvos em formato brasileiro: `backup-DD-MM-YYYY_HH-MM-SS.sql`

**Exemplos:**
- `backup-27-11-2025_01-24-30.sql`
- `backup-27-11-2025_14-35-45.sql`

```bash
# Listar backups
ls -lh backups/

# Ver conteúdo de um backup
cat backups/backup-*.sql
```

## 🌐 API Endpoints

- `GET /api/itens` - Listar todos os itens
- `POST /api/item` - Inserir novo item
- `POST /api/delete-all` - Deletar todos os itens
- `GET /api/backups` - Listar backups disponíveis
- `POST /api/trigger-backup` - Executar backup manual
- `POST /api/trigger-restore` - Restaurar último backup
- `GET /api/current-time` - Obter horário atual do servidor (Brasília)
- `GET /api/auto-backup-config` - Obter configuração do backup automático
- `POST /api/configure-auto-backup` - Configurar backup automático
- `GET /health` - Status do sistema