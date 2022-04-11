var startTime = 50
// This will give how much the bot wants to buy or sell. This number is in the range of -1 to 1
export function predict(botStrategy, time, stockData) {
    let comparison = stockData[time - 1]
    let count = 1
    let total = 0
    botStrategy.forEach(element => {
        if (count == 1) {
            total += element
        } else {
            if (time - count >= 0) {
                total += element * ((stockData[time - count]/comparison)-1)
            } else {
                total += element * ((stockData[0]/comparison)-1)
            }
        }
        count ++
    })
    if (total > 1) {
        total = 1
    } else if (total < -1) {
        total = -1
    }
    return total
}

function simulateBot(ticker, stockData, botStrategy) {
    var mysql = require('mysql');
    const connection = mysql.createConnection({
        host     : '127.0.0.1',
        user     : 'stock-ai',
        password : "password",
        database : 'stock'
        });
    // Generates a random table for speed reasons.
    let randomTable = "temp" + Math.floor(1000 * Math.random()).toString()
    connection.query(`DROP TABLE IF EXISTS ${randomTable}`, function() {})
    connection.query(`CREATE TABLE ${randomTable} (time int, bestBot float)`, function() {})
    let money = stockData[startTime]
    let stocks = 0
    let queryStatement = `INSERT INTO ${randomTable} VALUES`
    let queryParams = []
    for (let count = startTime; count < stockData.length; count++) {
        let order = predict(botStrategy, count, stockData)
        if (order < 0) {
            order *= -1
            money += stocks * stockData[count] * order
            stocks *= 1 - order
        } else {
            stocks += money / stockData[count] * order
            money *= 1 - order
        }
        queryStatement += " (?, ?),"
        queryParams.push(count+1, stocks * stockData[count] + money)
    }
    console.log(`Finished calculating the values for bot of the stock ${ticker}`)
    // Calculates the prediction of the stock
    try {
        connection.query("UPDATE stockMeta SET prediction=? WHERE ticker=?", [predict(botStrategy, stockData.length, stockData), ticker], function() {})
        connection.query(queryStatement.slice(0, queryStatement.length-1), queryParams)
        connection.query(`UPDATE stocks SET bestBot=(SELECT bestBot FROM ${randomTable} WHERE time=stocks.time) WHERE ticker=?;`, [ticker])
        connection.query(`DROP TABLE ${randomTable}`)
    } catch(err) {
        console.log(`There was an error in updating bot values for stock; ${err.mesage}`)
    }
    connection.query(`UPDATE stocks SET bestBot=0 WHERE bestBot IS NULL;`)
    connection.query("UPDATE stockMeta SET lastBotUpdate=? WHERE ticker=?", [parseInt(Date.now() / 1000 / 3600 / 24), predict(botStrategy, stockData.length, stockData), ticker], function() {
        console.log(`Finished updating values for bot for the stock ${ticker}`)
    })
    connection.end()
}
// Will update the values for the bot of on the stock
export async function simulateBestBotStock(ticker, stockData) {
    var mysql = require('mysql');
    const connection2 = mysql.createConnection({
        host     : '127.0.0.1',
        user     : 'stock-ai',
        password : "password",
        database : 'stock'
        });
    connection2.query("SELECT * FROM stockMeta WHERE ticker=?", [ticker], function(error, results, fields) {
        if (results.length > 0) {
            if (parseInt(results[0].lastBotUpdate) != parseInt(Date.now() / 1000 / 3600 / 24) && parseInt(results[0].lastBotUpdate) != 0) {
                // Makes sure to lock the stock to prevent uneccessary updates to the bot part
                connection2.query("UPDATE stockMeta SET lastBotUpdate=0 WHERE ticker=?", [ticker], function() {})
                connection2.query("SELECT * FROM bot ORDER BY earnings DESC", function(error, results, fields) {
                    // Makes sure that a bot has been trained
                    if (results.length > 0) {
                        console.log(`Updating values for bot with the stock ${ticker}`)
                        simulateBot(ticker, stockData, JSON.parse(results[0].strategy))
                    } else { // Makes sure to show that the stock has been unlocked if there are no bots.
                        connection2.query("UPDATE stockMeta SET lastBotUpdate=? WHERE ticker=?", [parseInt(Date.now() / 1000 / 3600 / 24), ticker], function() {})
                    }
                })
            }
        }
    })
}