import { getSession } from "next-auth/react"
export default async function handler(req, res) {
    var mysql = require('mysql')
    var connection = mysql.createConnection({
        host     : '127.0.0.1',
        user     : 'stock-ai',
        password : "password",
        database : 'stock'
        });
    const session = await getSession({ req })
    if (req.method == "PUT") { 
        if (session) {
            if (req.body.botLevel > 2 || req.body.botLevel < 0) {
                res.status(501)
            } else {
                const botLevel = ["primaryBot", "secondaryBot", "tertiaryBot"][req.body.botLevel]
                connection.query(`UPDATE stockMeta SET ${botLevel}=? WHERE ticker=?`, [req.body.botName, req.query.stock])
                res.status(200).json(req)
            }
        } else {
            res.status(401)
        }
    } else {
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}