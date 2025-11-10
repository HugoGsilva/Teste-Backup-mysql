-- Ajuste DB_NAME abaixo se sua variável MYSQL_DATABASE não for "test_db"
CREATE DATABASE IF NOT EXISTS `test_db`;
USE `test_db`;

CREATE TABLE IF NOT EXISTS itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL
);
