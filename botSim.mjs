import { createConnection } from "mysql"
var startTime = 50
// This will give how much the bot wants to buy or sell. This number is in the range of -1 to 1
export function prediction(botStrategy, time, stockData) {
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
    const connection = createConnection({
        host     : '127.0.0.1',
        user     : 'stock-ai',
        password : "password",
        database : 'stock'
        });
    let money = stockData[startTime]
    let stocks = 0
    for (let count = startTime; count < stockData.length; count++) {
        let order = prediction(botStrategy, count, stockData)
        if (order < 0) {
            order *= -1
            money += stocks * stockData[count] * order
            stocks *= 1 - order
        } else {
            stocks += money / stockData[count] * order
            money *= 1 - order
        }
        connection.query("UPDATE stocks SET bestBot=? WHERE time=? and ticker=?", [stocks * stockData[count] + money, count+1, ticker],function(error, results, fields) {})
    }
    connection.query("UPDATE stockMeta SET lastBotUpdate=? WHERE ticker=?", [parseInt(Date.now() / 1000 / 60 / 10), ticker], function() {
        console.log(`Finished updating values for bot for the stock ${ticker}`)
    })
}
// Will update the values for the bot of on the stock
export async function simulateBestBotStock(ticker, stockData) {
    const connection2 = createConnection({
        host     : '127.0.0.1',
        user     : 'stock-ai',
        password : "password",
        database : 'stock'
        });
    connection2.query("SELECT * FROM stockMeta WHERE ticker=?", [ticker], function(error, results, fields) {
        if (results.length > 0) {
            if (parseInt(results[0].lastBotUpdate) != parseInt(Date.now() / 1000 / 60 / 10) && parseInt(results[0].lastBotUpdate) != 0) {
                connection2.query("UPDATE stockMeta SET lastBotUpdate=0 WHERE ticker=?", [ticker], function() {})
                connection2.query("SELECT * FROM bot ORDER BY earnings DESC", function(error, results, fields) {
                    // Makes sure that a bot has been trained
                    if (results.length > 0) {
                        console.log(`Updating values for bot for the stock ${ticker}`)
                        simulateBot(ticker, stockData, JSON.parse(results[0].strategy))
                    }
                })
            }
        }
    })
}