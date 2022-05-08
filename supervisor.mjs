import { predict } from "./botSim.mjs"
import { createConnection } from "mysql"
import {mysql_host, mysql_database, mysql_user, mysql_password} from "./enviromental.mjs"

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
    host     : mysql_host,
    user     : mysql_user,
    password : mysql_password,
    database : mysql_database
    });
// Creates all the tables if they dont exist
connection.query("CREATE TABLE IF NOT EXISTS stocks (ticker varchar(10), time int, close float)")
connection.query("CREATE TABLE IF NOT EXISTS stockMeta (ticker varchar(10) PRIMARY KEY, lastUpdate int, primaryBot varchar(20), secondaryBot varchar(20), tertiaryBot varchar(20))")
connection.query("CREATE TABLE IF NOT EXISTS bot (name varchar(20) PRIMARY KEY, strategy text)")
connection.query("CREATE TABLE IF NOT EXISTS tasks (progress float, saveInterval int, botName varchar(20) PRIMARY KEY, strategy text, generationSize int, generations int, inUse bool, mutation float)")
connection.query("CREATE TABLE IF NOT EXISTS taskStocks (name varchar(20), ticker varchar(10), start int, end int)")
// Makes sure that all tasks are set as not in use
connection.query("UPDATE tasks SET inUse=0")
// Adds a simple default bot
connection.query("INSERT IGNORE INTO bot VALUES ('', '[-5, 4, 3, 2, 1, 0]')")
setInterval(findTasks, 10000)
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
                if (results.length > 0) {
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
                } else {
                    connection.query("UPDATE tasks SET inUse=0 WHERE botName=?", [task.botName])
                    console.log(`Failed to start task with name ${task.botName} due to no data existing for task to train on`)
                }
                
            })
        }
    })
}
