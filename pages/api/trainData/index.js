import { getSession } from "next-auth/react"
export default async function handler(req, res) {
    let bot = ""
    const session = await getSession({ req })
    var mysql = require('mysql')
    // Makes sure the admin is logged in
    if (session) {
        var connection = mysql.createConnection({
            host     : '127.0.0.1',
            user     : 'stock-ai',
            password : "password",
            database : 'stock'
            });
        switch (req.method) {
            case "GET": // Gets the training data for the bot
                connection.query("SELECT * FROM taskStocks WHERE name=?", [bot], function (error, results2, fields) {
                    res.status(200).json(results2)
                    connection.end()
                })
                break;
            case "PUT": // Will update the training data for the bot
                // Will make sure that the stock exists
                connection.query("SELECT * FROM stockMeta WHERE ticker=?", [req.body.new.ticker], function(error, results2, fields) {
                    // Will make sure that the values are valid
                    if ((results2.length > 0 && req.body.new.start > 0 ) && (req.body.new.end > 0 && req.body.new.end > req.body.new.start )) {
                        // Will delete the old data
                        connection.query("DELETE FROM taskStocks WHERE (ticker=? and name=?) and (start=? and end=?)", [req.body.old.ticker, bot, req.body.old.start, req.body.old.end], function(error, results3, fields) {
                            // Will add the new data
                            connection.query("INSERT INTO taskStocks VALUES (?, ?, ?, ?)", [bot, req.body.new.ticker, req.body.new.start, req.body.new.end], function(error, results, fields) {
                                res.status(200).end("Changed data")
                                connection.end()
                            })
                        })
                    } else {
                        res.status(500).end("Invalid values")
                        connection.end()
                    }
                })
                break;
            case "DELETE":
                // Will delete the data
                connection.query("DELETE FROM taskStocks WHERE (ticker=? and name=?) and (start=? and end=?)", [req.body.ticker, body, req.body.start, req.body.end], function(error, results, fields) {
                    res.status(200).end("Deleted data")
                    connection.end()
                })
                break;
            default:
                connection.end()
                res.status(405).end(`Method ${req.method} Not Allowed`)
                break;
        }
    } else {
        res.status(401).end("Not logged in")
    }
}