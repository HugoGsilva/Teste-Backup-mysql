# Testes do Sistema de Backup

## Testes via PowerShell (Windows)

### 1. Health Check

```powershell
Invoke-WebRequest -Uri http://localhost:3000/health -Method GET
```

### 2. Inserir dados

```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/item -Method POST -ContentType "application/json" -Body '{"nome":"Item 1"}'
Invoke-WebRequest -Uri http://localhost:3000/api/item -Method POST -ContentType "application/json" -Body '{"nome":"Item 2"}'
Invoke-WebRequest -Uri http://localhost:3000/api/item -Method POST -ContentType "application/json" -Body '{"nome":"Item 3"}'
```

### 3. Listar dados

```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/itens -Method GET
```

### 4. Criar backup

```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/trigger-backup -Method POST
```

### 5. Listar backups

```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/backups -Method GET
```

### 6. Simular desastre (deletar tudo)

```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/delete-all -Method POST
```

### 7. Verificar que dados foram deletados

```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/itens -Method GET
```

### 8. Restaurar do backup

```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/trigger-restore -Method POST
```

### 9. Verificar que dados foram restaurados

```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/itens -Method GET
```

## Testes via curl (Linux/Mac)

### 1. Health Check

```bash
curl http://localhost:3000/health
```

### 2. Inserir dados

```bash
curl -X POST http://localhost:3000/api/item \
  -H "Content-Type: application/json" \
  -d '{"nome":"Item 1"}'
```

### 3. Listar dados

```bash
curl http://localhost:3000/api/itens
```

### 4. Criar backup

```bash
curl -X POST http://localhost:3000/api/trigger-backup
```

### 5. Listar backups

```bash
curl http://localhost:3000/api/backups
```

### 6. Simular desastre

```bash
curl -X POST http://localhost:3000/api/delete-all
```

### 7. Restaurar do backup

```bash
curl -X POST http://localhost:3000/api/trigger-restore
```

## Verificar arquivos de backup

### Windows

```powershell
dir backups
Get-Content backups\backup-*.sql | Select-Object -First 20
```

### Linux/Mac

```bash
ls -lh backups/
head -20 backups/backup-*.sql
```

## Acessar MySQL diretamente

```bash
docker compose exec db mysql -uroot -pSecret123! test_db -e "SELECT * FROM itens"
```

## Logs em tempo real

```bash
docker compose logs -f app
```

## Status dos containers

```bash
docker compose ps
```

## Fluxo completo de teste

```powershell
# 1. Inserir dados
Invoke-WebRequest -Uri http://localhost:3000/api/item -Method POST -ContentType "application/json" -Body '{"nome":"Teste Completo"}'

# 2. Verificar inserção
Invoke-WebRequest -Uri http://localhost:3000/api/itens -Method GET

# 3. Fazer backup
Invoke-WebRequest -Uri http://localhost:3000/api/trigger-backup -Method POST

# 4. Simular desastre
Invoke-WebRequest -Uri http://localhost:3000/api/delete-all -Method POST

# 5. Confirmar que dados foram deletados
Invoke-WebRequest -Uri http://localhost:3000/api/itens -Method GET

# 6. Restaurar
Invoke-WebRequest -Uri http://localhost:3000/api/trigger-restore -Method POST

# 7. Verificar restauração
Invoke-WebRequest -Uri http://localhost:3000/api/itens -Method GET
```

## Resultados esperados

✅ **Inserção**: Status 201, retorna `{"insertedId": N}`  
✅ **Listagem**: Status 200, retorna array de objetos  
✅ **Backup**: Status 200, retorna `{"ok":true,"file":"backup-*.sql"}`  
✅ **Desastre**: Status 200, retorna `{"ok":true}`  
✅ **Restore**: Status 200, retorna `{"ok":true,"file":"backup-*.sql"}`  
✅ **Health**: Status 200, retorna `{"status":"ok"}`
