service mariadb start
mysql -u root -e "CREATE DATABASE IF NOT EXISTS stock"
mysql -u root -e "CREATE user IF NOT EXISTS 'stock-ai'@'localhost' IDENTIFIED BY 'password';"
mysql -u root -e "GRANT ALL PRIVILEGES ON *.* TO 'stock-ai'@localhost IDENTIFIED BY 'password';"
mysql -u root --database=stock -e "CREATE TABLE IF NOT EXISTS stocks (ticker varchar(10), time int, close float);"
mysql -u root --database=stock -e "CREATE TABLE IF NOT EXISTS stockMeta (ticker varchar(10) PRIMARY KEY, lastUpdate int, primaryBot varchar(20), secondaryBot varchar(20), tertiaryBot varchar(20));"
mysql -u root --database=stock -e "CREATE TABLE IF NOT EXISTS bot (name varchar(20) PRIMARY KEY, strategy text);"
mysql -u root --database=stock -e "CREATE TABLE IF NOT EXISTS tasks (progress float, saveInterval int, botName varchar(20) PRIMARY KEY, strategy text, generationSize int, generations int, inUse bool, mutation float);"
mysql -u root --database=stock -e "CREATE TABLE IF NOT EXISTS taskStocks (name varchar(20), ticker varchar(10), start int, end int);"
# Makes sure that all tasks are empty
mysql -u root --database=stock -e "UPDATE tasks SET inUse=0;"
# Adds a simple default bot
mysql -u root --database=stock -e "INSERT IGNORE INTO bot VALUES ('', '[-5, 4, 3, 2, 1, 0]');"
nodejs supervisor.mjs &
npm run $TYPE