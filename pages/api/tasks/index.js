import {mysql_host, mysql_database, mysql_user, mysql_password} from "../../../enviromental"
import { getSession } from "next-auth/react"
import { resolveHref } from "next/dist/shared/lib/router/router"
export default async function handler(req, res) {
    var mysql = require('mysql')
    const session = await getSession({ req })
    if (session) {
        switch (req.method) {
            case "POST": // Will add a new task
                let size = parseInt(req.body.size)
                let generations = parseInt(req.body.generations)
                let generationSize = parseInt(req.body.generationSize)
                let mutation = parseFloat(req.body.mutation)
                let saveInterval = parseInt(req.body.saveInterval)
                let name = String(req.body.name)
                let prevName = String(req.body.prevName)
                // Makes sure the bot has valid parameters
                if ((size > 0 && size < 1000000000) && (generations > 0 && generations < 1000000000) && (mutation > 0) && (saveInterval > 0) && (generationSize > 0 && generationSize < 10000000)) {
                    // Gets the source strategy
                    var connection = mysql.createConnection({
                        host     : mysql_host,
                        user     : mysql_user,
                        password : mysql_password,
                        database : mysql_database
                        });
                    await new Promise( (resolve) => {connection.query("SELECT strategy FROM bot WHERE name=?", [prevName], function(error, results) {
                        // Creates an empty strategy of the specified length if no source 
                        let strategy = Array(size).fill(0)
                        // Checks if the strategy exists
                        if (results.length > 0) {
                            // Makes sure the strategy is the correct size
                            strategy = JSON.parse(results[0].strategy)
                            while (strategy.length > size) {
                                strategy.pop()
                            }
                            while (strategy.length < size) {
                                strategy.push(0)
                            }
                        }
                        // Converts the strategy to JSON
                        strategy = JSON.stringify(strategy)
                        resolve(strategy)
                    })}).then((strategy) => {
                        connection.query("INSERT INTO tasks VALUES(0, ?, ?, ?, ?, ?, 0, ?, 0)", [saveInterval, name, strategy, generationSize, generations, mutation])
                        res.status(200).end("Added task succesfully")
                        connection.end()
                        return
                    })
                } else {
                    res.status(500).end("Invalid request")
                }
                break;
            case "GET":
                var connection = mysql.createConnection({
                    host     : mysql_host,
                    user     : mysql_user,
                    password : mysql_password,
                    database : mysql_database
                    });
                // Used to return a list of tasks
                await new Promise ((resolve) => {connection.query("SELECT progress, saveInterval, botName, generations, generations, inUse, previousTimeInterval FROM tasks", function(error, results, fields) {
                    resolve(results)
                })}).then((val) => {
                    res.status(200).json(val)
                })
                connection.end()
                break;
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
                break;
        }
    } else {
        res.status(401).end("Not logged in")
    }
}