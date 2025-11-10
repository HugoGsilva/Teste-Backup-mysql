# Teste-Backup-mysql

Sistema simplificado para testar backups MySQL com interface web.

## Arquitetura

- `app`: Container Node.js (Express) servindo a UI em `http://localhost:3000`, executando `mysqldump`/`mysql` para backup e restauração e garantindo o schema da tabela `itens`.
- `db`: Container MySQL 8.0 inicializado com `db/init.sql`.
- Os arquivos `.sql` gerados ficam em `./backups`, montado no container `app` como `/backups`.

## Como executar

1. `docker compose up -d --build`
2. Acompanhe os logs com `docker compose logs -f app db` até ver `Tabela itens verificada/criada`.
3. Acesse `http://localhost:3000` para inserir itens, fazer backup, truncar e restaurar.

## Observações

- Backups listáveis pelo host: `ls backups` ou dentro do container `docker compose exec app ls /backups`.
- Para reiniciar tudo (apaga dados e backups): `docker compose down -v` seguido de `rm -rf backups` (se desejar).
- Logs MySQL: `docker compose logs -f db`.
- Se `init.sql` não rodar, confirme final de linha LF, nome do banco (`test_db`) e execute `docker compose down -v && docker compose up -d`.
- Para inspecionar o script: `docker compose exec db sh -c "ls -la /docker-entrypoint-initdb.d && cat /docker-entrypoint-initdb.d/init.sql"`.
- Variáveis padrão: `MYSQL_ROOT_PASSWORD=Secret123!` e banco `test_db`. Ajuste conforme necessário, lembrando que o MySQL exige senha com pelo menos 8 caracteres.