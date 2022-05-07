export default async function handler({ query: { term } }, res) {
    var mysql = require('mysql')
    var connection = mysql.createConnection({
        host     : '127.0.0.1',
        user     : 'stock-ai',
        password : "password",
        database : 'stock'
        });
    const strategy = await new Promise((resolve) => {connection.query("SELECT strategy FROM bot WHERE name=?", [term], function (error, results2, fields) {
        if (results2.length > 0) {
            resolve(results2[0].strategy)
        } else {
            resolve([])
        }
    })}).then((val) => {return val})
    connection.end()
    res.status(200).json(strategy)
}