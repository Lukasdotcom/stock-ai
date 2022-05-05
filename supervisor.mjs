import { predict } from "./botSim.mjs"
import { createConnection } from "mysql"

// Will simulate a bot and return the amount of money the bot would have earned.
function simulateBot(stockData, botStrategy, start_time=10) {
    let money = stockData[start_time]
    let stocks = 0
    for (let count = start_time; count < stockData.length; count++) {
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
function mutate(strategy, mutation) {
    return strategy.map(element => element + ((Math.random()) - 0.5) * 2 * mutation)
}
// Will simulate a generation
function simulateGenerations (bot, data, generationSize, start_time, mutation) {
    let bestBot = bot
    let bestScore = simulateBot(data, bot, start_time)
    for (let i=1; i<generationSize; i++) {
        let newBot = mutate(bot, mutation)
        let score = simulateBot(data, newBot, start_time)
        if (score > bestScore) {
            bestScore = score
            bestBot = newBot
        }
    }
    return bestBot
}

const connection = createConnection({
    host     : '127.0.0.1',
    user     : 'stock-ai',
    password : "password",
    database : 'stock'
    });

setInterval(findTaks, 10000)
findTasks()
// Finds a task to run
function findTasks() {
    connection.query("SELECT * FROM tasks WHERE not inUse", function(error, results, fields) {
        if (results.length > 0) {
            let task = results[Math.floor(Math.random() * results.length)]
            console.log(`Starting task with name ${task.botName}`)
            connection.query("UPDATE tasks SET inUse=1 WHERE botName=?", [task.botName])
            let generation = Math.floor(task.progress * task.generations) // Stores the current generation
            let strategy = JSON.parse(task.strategy) // Used to store the name of the strategy
            connection.query("SELECT * FROM taskStocks WHERE name=?", [task.botName], async function(error, results, fields) {
                while (generation < task.generations) { // Loops until all the generations are finished
                    // Gets the closing prices for the range of data that was asked for
                    let stock = results[Math.floor(results.length * Math.random())]
                    let stockData = new Promise((resolve)=> {
                        connection.query("SELECT * FROM stocks WHERE time<? and ticker=?", [stock.end, stock.ticker], function(error, results, fields) {
                            resolve(results)
                        })
                    }).then((val) => {
                        let stockData = []
                        val.forEach((val2) => {
                            stockData.push(val2.close)
                        })
                        return stockData
                    })
                    generation ++
                    // Used to run simulation on bots
                    strategy = simulateGenerations(strategy, await stockData, task.generationSize, stock.start, task.mutation)
                    // Makes sure to update the task everytime it should be saved
                    if (generation % task.saveInterval == 0) {
                        connection.query("UPDATE tasks SET progress=?, strategy=? WHERE botName=?", [generation / task.generations, JSON.stringify(strategy), task.botName])
                    }
                }
                // Will finish up the task and save the bot data
                connection.query("INSERT INTO bot VALUES (?, ?) ON DUPLICATE KEY UPDATE strategy=?", [task.botName, JSON.stringify(strategy), JSON.stringify(strategy)])
                connection.query("DELETE FROM tasks WHERE botName=?", [task.botName])
                console.log(`Finished task with name ${task.botName}`)
            })
        }
    })
}
