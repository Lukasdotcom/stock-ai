service mariadb start
mysql -u root -e "CREATE DATABASE IF NOT EXISTS stock"
mysql -u root -e "CREATE user IF NOT EXISTS 'stock-ai'@'localhost' IDENTIFIED BY 'password';"
mysql -u root -e "GRANT ALL PRIVILEGES ON *.* TO 'stock-ai'@localhost IDENTIFIED BY 'password';"
mysql -u root --database=stock -e "CREATE TABLE IF NOT EXISTS stocks (ticker varchar(10), time int, close float, bestBot float);"
mysql -u root --database=stock -e "CREATE TABLE IF NOT EXISTS stockMeta (ticker varchar(10), lastUpdate int, lastBotUpdate int);"
mysql -u root --database=stock -e "CREATE TABLE IF NOT EXISTS bot (strategy text, earnings float, stock varchar(10));"
mysql -u root --database=stock -e "CREATE TABLE IF NOT EXISTS bestBot (strategy text);"
nodejs supervisor.mjs &
npm run $TYPE