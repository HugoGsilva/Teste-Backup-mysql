FROM python:3.10-alpine

# trabalhar em /backup-service (scripts usarão este diretório)
WORKDIR /backup-service

# instalar cliente (mariaDB client fornece mysql e mysqldump)
RUN apk add --no-cache mariadb-client

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backup.sh restore.sh api.py ./
RUN chmod +x ./backup.sh ./restore.sh

ENV FLASK_APP=api.py

EXPOSE 5000

CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]
