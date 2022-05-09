import { getSession } from "next-auth/react"
import {mysql_host, mysql_database, mysql_user, mysql_password} from "../../enviromental"
export default async function handler(req, res) {
    var mysql = require('mysql')
    var connection = mysql.createConnection({
        host     : mysql_host,
        user     : mysql_user,
        password : mysql_password,
        database : mysql_database
        });
    connection.query("DESCRIBE tasks", function(error, results, fields) {
        res.status(200).json(results)
    })
}