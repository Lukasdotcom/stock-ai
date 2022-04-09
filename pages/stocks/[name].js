import Chart from "react-google-charts";
import { parse } from "csv-parse";
// Creates a simple graph with all the prices of the stock
export default function Graph( { title, stock } ) {
    let data = [["Date", "Stock Price"]]
    let count = 0
    stock.forEach(element => {
        data.push([count, element])
        count ++
    });
    return (
        <>
            <h1>{title}</h1>
            <Chart
                chartType="LineChart"
                data={data}
                width="100%"
                height="400px"
                legendToggle
            />
        </>
    )
  }

export async function getServerSideProps(context, res) {
    const day = Math.floor(Date.now() / 1000 / 3600 / 24)
    const title = context.params.name
    var mysql = require('mysql');
    var connection = mysql.createConnection({
        host     : '127.0.0.1',
        user     : 'stock-ai',
        password : "password",
        database : 'stock'
        });
    const cached = await new Promise((resolve) => connection.query("SELECT * FROM stockMeta WHERE ticker=?", [title], function (error, results, fields) {
        resolve(results)
    })).then((val => {
        if (val && val.length > 0) {
            return parseInt(val[0].lastUpdate) == day
        } else {
            return false
        }
    }))
    var stock = []
    if (! cached) {
        console.log(`Downloading date for stock ${title}`)
        // Gets the latest data from yahoo finance
        const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/download/${title}?period1=0&period2=2229456811&interval=1d&events=history&includeAdjustedClose=true`)
        // Reads the csv file
        const parser = parse(await response.text(), {
            columns: true,
            skip_empty_lines: true
        })
        for await (const record of parser) {
            stock.push(parseFloat(record["Close"]))
        }
        // Checks that the stock exists
        if (stock.length > 0) {
            var connection2 = mysql.createConnection({
                host     : '127.0.0.1',
                user     : 'stock-ai',
                password : "password",
                database : 'stock'
                });
            // Adds the data to the database
            let count = 0
            connection2.query("DELETE FROM stockMeta WHERE ticker=?;",[title])
            connection2.query("INSERT INTO stockMeta VALUES(?, ?, ?);", [title, day, (Date.now() / 1000 /60)])
            connection2.query('DELETE FROM stocks WHERE ticker=?;', [title]);
            stock.forEach(element => {
                count ++;
                connection2.query('INSERT INTO stocks VALUES (?, ?, ?, ?)', [title, count, element, 0]);
            })
            connection2.end()
        }
    } else {
        stock = await new Promise((resolve) => {
            connection.query("SELECT * FROM stocks WHERE ticker=? ORDER BY time ASC", [title], function (error, results2, fields) {
                let stockData = []
                let record = results2 ? results2 : []
                record.forEach(element => {
                    stockData.push(parseFloat(element.close))
                })
                resolve(stockData)
            })
        }).then((val => {return val}))
    }
    connection.end();
    if (stock.length < 1) {
        return {
            notFound: true,
        }
    }
    return {
        props : {
            stock, title, 
        },
    }
}