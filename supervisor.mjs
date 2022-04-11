import { predict } from "./botSim.mjs"
import { createConnection } from "mysql"

// Config
const generationSize = 100
const maxChangeGeneration = 1
const survivors = 10
const startTime = 50
const timeBetweenGenerations = 333
const AISize = 100
// Will simulate a bot and return the amount of money the bot would have earned.
function simulateBot(stockData, botStrategy) {
    let money = stockData[startTime]
    let stocks = 0
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
    }
    return stocks * stockData[stockData.length - 1] + money
}
// Used to mutate
function mutate(strategy) {
    return strategy.map(element => element + ((Math.random()) - 0.5) * 2 * maxChangeGeneration)
}
// Will simulate a generation
function simulateGenerations(bots) {
    while (bots.length < generationSize) {
        bots.push({"strategy" : mutate(bots[Math.floor(Math.random() * bots.length)].strategy), "earnings" : 0})
    }
    connection.query("SELECT * FROM stockMeta;", function(error, results, fields) {
        if (results.length > 0) {
            // Picks a random stock to start of with
            var stock = results[Math.floor(Math.random() * results.length)].ticker
            // Gets the data for the stock
            connection.query("SELECT * FROM stocks WHERE ticker=?", [stock], function(error, results, fields) {
                var stockData = []
                results.forEach(element => {
                    stockData.push(parseFloat(element.close))
                })
                // Simulates every single bot
                for (let i = 0; i < bots.length; i++) {
                    bots[i].earnings = simulateBot(stockData, bots[i].strategy)
                }
                bots.sort(function(a, b) {return b.earnings - a.earnings});
                while(bots.length > survivors) {
                    bots.pop()
                }
                // Waits until the next generation
                console.log(`Finished generation with highest earnings of ${bots[0].earnings} on ${stock}`)
                setTimeout(function() {saveLoadMutate(bots)}, timeBetweenGenerations)
            })
        } else {
            setTimeout(function() {simulateGenerations(bots)}, 5000)
        }
    })
}

const connection = createConnection({
    host     : '127.0.0.1',
    user     : 'stock-ai',
    password : "password",
    database : 'stock'
    });
// Makes sure to reset the lastBotUpdate flag so it can be retriggered
connection.query("UPDATE stockMeta SET lastBotUpdate=1 WHERE lastBotUpdate=0", function() {})
// Makes sure that the correct amount of bots are loaded.
function saveLoadMutate(botList) {
    if (botList == undefined) {
        var botList = []
        connection.query("SELECT * FROM bot", function(error, results, fields) {
            results.forEach(element => {
                botList.push({"strategy": JSON.parse(element.strategy), "earnings" : 0.0})
            })
        })
    } else {
        connection.query("DELETE FROM bot;", function() {})
        let count = 0
        botList.forEach(element => {
            if (count < survivors) {
                connection.query("INSERT INTO bot VALUES (?, ?);", [JSON.stringify(element.strategy), element.earnings], function() {})
            }
            count ++
        })
    }
    if (botList.length < survivors) {
        for (let index = 0; index < generationSize - botList.length; index++) {
            botList.push({ "strategy" : mutate(Array(AISize).fill(0)), "earnings" : 0})
        }
    } else if (botList.length > survivors) {
        for (let index = 0; index < botList.length - generationSize; index++) {
            botList.pop()
        }
    }
    simulateGenerations(botList)
}
saveLoadMutate()