CREATE USER IF NOT EXISTS 'sadavod'@'localhost' IDENTIFIED BY 'SadavodParser2025';
GRANT ALL PRIVILEGES ON sadavod_parser.* TO 'sadavod'@'localhost';
FLUSH PRIVILEGES;
