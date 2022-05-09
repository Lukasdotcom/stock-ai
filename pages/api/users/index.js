import {mysql_host, mysql_database, mysql_user, mysql_password} from "../../../enviromental"
import { getSession } from "next-auth/react"
export default async function handler(req, res) {
    const session = await getSession({ req })
    var mysql = require('mysql')
    // Makes sure the admin is logged in
    if (session) {
        var connection = mysql.createConnection({
            host     : mysql_host,
            user     : mysql_user,
            password : mysql_password,
            database : mysql_database
            });
        switch (req.method) {
            case "GET": // Gets a list of all the users and returns it to the user
                await new Promise((resolve) => {
                    connection.query("SELECT email FROM users", function(error, results, fields) {
                        resolve(results)
                    })
                }).then((val) => {
                    res.status(200).json(val)
                })
                break;
            case "POST": // Used to add a user
                await new Promise((resolve) => {
                    // Makes sure that it is a valid email (https://www.w3resource.com/javascript/form/email-validation.php for more information)
                    if ((/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email))) {
                        connection.query("INSERT INTO users VALUES(?)", [req.body.email])
                        resolve("Added user")
                    } else {
                        throw "Not an email"
                    }
                }).then((val) => {
                    res.status(200).end(val)
                }).catch((error) => {
                    res.status(500).end(error)
                })
                break;
            case "DELETE": // Used to add a user
                await new Promise((resolve) => {
                    connection.query("DELETE FROM users WHERE email=?", [req.body.email], function() {
                        resolve("Deleted user")
                    })
                }).then((val) => {
                    res.status(200).end(val)
                }).catch((error) => {
                    res.status(500).end(error)
                })
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