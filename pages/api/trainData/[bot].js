import {mysql_host, mysql_database, mysql_user, mysql_password} from "../../../enviromental"
import { getSession } from "next-auth/react"
export default async function handler(req, res) {
    let bot = req.query.bot
    const session = await getSession({ req })
    var mysql = require('mysql')
    // Makes sure the admin is logged in
    if (session) {
        var connection = await mysql.createConnection({
            host     : mysql_host,
            user     : mysql_user,
            password : mysql_password,
            database : mysql_database
            });
        switch (req.method) {
            case "GET": // Gets the training data for the bot
                await new Promise((resolve) => {
                    connection.query("SELECT * FROM taskStocks WHERE name=?", [bot], function (error, results2, fields) {
                        resolve(results2)
                })}).then((val) => {
                    res.status(200).json(val)
                })
                break;
            case "PUT": // Will update the training data for the bot
                await new Promise((resolve, reject) => {
                    // Will make sure that the stock exists
                    connection.query("SELECT * FROM stockMeta WHERE ticker=?", [req.body.new.ticker], function(error, results2, fields) {
                        // Will make sure that the values are valid
                        if ((results2.length > 0 && req.body.new.start > 0 ) && (req.body.new.end > 0 && req.body.new.end > req.body.new.start )) {
                            // Will delete the old data
                            connection.query("DELETE FROM taskStocks WHERE (ticker=? and name=?) and (start=? and end=?)", [req.body.old.ticker, bot, req.body.old.start, req.body.old.end], function(error, results3, fields) {
                                resolve("Changed data")
                            })
                        } else {
                            reject("Invalid Values")
                        }
                    })
                }).then((val) => {
                    // Will add the new data
                    connection.query("INSERT INTO taskStocks VALUES (?, ?, ?, ?)", [bot, req.body.new.ticker, req.body.new.start, req.body.new.end])
                    res.status(200).end(val)
                }).catch((error) => {
                    res.status(500).end(error)
                })
                break;
            case "DELETE":
                // Will delete the data
                connection.query("DELETE FROM taskStocks WHERE (ticker=? and name=?) and (start=? and end=?)", [req.body.ticker, bot, req.body.start, req.body.end])
                res.status(200).end("Deleted data")
                break;
            default:
                res.status(405).end(`Method ${req.method} Not Allowed`)
                break;
        }
        connection.end()
    } else {
        res.status(401).end("Not logged in")
    }
}