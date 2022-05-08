import {mysql_host, mysql_database, mysql_user, mysql_password} from "../../../enviromental"
export default async function handler(req, res) {
    const term = ""
    var mysql = require('mysql')
    var connection = mysql.createConnection({
        host     : mysql_host,
        user     : mysql_user,
        password : mysql_password,
        database : mysql_database
        });
    const strategy = await new Promise((resolve) => {connection.query("SELECT strategy FROM bot WHERE name=?", [term], function (error, results2, fields) {
        if (results2.length > 0) {
            resolve(JSON.parse(results2[0].strategy))
        } else {
            resolve([])
        }
    })}).then((val) => {return val})
    connection.end()
    res.status(200).json(strategy)
}