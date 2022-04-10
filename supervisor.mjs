import { prediction } from "./botSim.mjs";
import { createConnection } from "mysql"

// Config
var generationSize = 100
var maxChangeGeneration = 1
var survivors = 10
var startTime = 50
var timeBetweenGenerations = 333
// Will simulate a bot and return the amount of money the bot would have earned.
function simulateBot(stockData, botStrategy) {
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
    }
    return stocks * stockData[stockData.length - 1] + money
}
// Used to mutate
function mutate(strategy) {
    return strategy.map(element => element + ((Math.random()) - 0.5) * 2 * maxChangeGeneration)
}
// waits until the
function waitUntilNextGeneration() {
    setTimeout(simulateGenerations, timeBetweenGenerations)
}
// Used to mutate all the bots and kill all the weak ones
function mutateAll() {
    connection.query(`SELECT * FROM bot ORDER BY earnings DESC LIMIT ${survivors}`, function(error, results, fields) {
        connection.query("DELETE FROM bestBot;", function() {})
        connection.query("INSERT INTO bestBot VALUES (?);", [results[0].strategy], function() {})
        console.log(`Finished generation with highest earnings of ${results[0].earnings} on ${results[0].stock}`)
        let botList = []
        results.forEach(element => {
            botList.push(element.strategy)
        })
        while (botList.length < generationSize) {
            botList.push(JSON.stringify(mutate(JSON.parse(botList[Math.floor(Math.random() * botList.length)]))))
        }
        connection.query("DELETE FROM bot;", function() {})
        botList.forEach(element => {
            connection.query("INSERT INTO bot VALUES (?, ?, ?);", [element, 0, ""], function() {})
        })
        waitUntilNextGeneration()
    })
}
// Will simulate a generation
function simulateGenerations() {
    connection.query("SELECT * FROM stockMeta;", function(error, results, fields) {
        if (results.length > 0) {
            // Picks a random stock to start of with
            var stock = results[Math.floor(Math.random() * results.length)].ticker
            connection.query("SELECT * FROM bot WHERE stock!=?;", [stock], function(error, results, fields) {
                // Gets the prices for the stock
                var stockData = []
                var bots = results
                connection.query("SELECT * FROM stocks WHERE ticker=?", [stock], function(error, results, fields) {
                    results.forEach(element => {
                        stockData.push(parseFloat(element.close))
                    })
                    // Simulates every single bot
                    bots.forEach(element => {
                        let strategy = JSON.parse(element.strategy);
                        let earnings = simulateBot(stockData, strategy)
                        connection.query("UPDATE bot SET stock=?, earnings=? WHERE strategy=?", [stock, earnings, element.strategy], function() {})
                    })
                    mutateAll()
                })
            })
        } else {
            setTimeout(simulateGenerations, 5000)
        }
    })
}

const connection = createConnection({
    host     : '127.0.0.1',
    user     : 'stock-ai',
    password : "password",
    database : 'stock'
    });
// Makes sure that the correct amount of bots are in the database.
connection.query("SELECT * FROM bot", function(error, results, fields) {
    if (results.length < generationSize) {
        let defaultBot = Array(100).fill(0);
        for (let index = 0; index < generationSize - results.length; index++) {
            connection.query("INSERT INTO bot VALUES(?, ?, ?);", [JSON.stringify(mutate(defaultBot)), 0, ""])
        }
    } else if (results.length > generationSize) {
        for (let index = 0; index < results.length - generationSize; index++) {
            connection.query("DELETE FROM bot WHERE strategy=?;", [results[index].strategy])
        }
    }
    simulateGenerations()
})