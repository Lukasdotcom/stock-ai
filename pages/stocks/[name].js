import Chart from "react-google-charts";
import { parse } from "csv-parse";
import { predict, simulateBot } from "../../botSim.mjs"
import Head from 'next/head'

// Creates a simple graph with all the prices of the stock
export default function Graph( { title, stock, botStrategy } ) {
    let data = [["Date", "Stock Price", "Bot"]]
    let count = 0
    const prediction = predict(botStrategy, stock.length, stock)
    var bot = Array(500).fill(0)
    if (botStrategy.length > 0) {
        bot = simulateBot(stock.length-500, stock, botStrategy)
    }
    var stock2 = stock.slice(-500)
    stock2.forEach(element => {
        data.push([count, element, bot.length > count ? bot[count] : 0])
        count ++
    });
    return (
        <>
            <Head>
                <title>{title}</title>
            </Head>
            <h1>{title}</h1>
            <Chart
                chartType="LineChart"
                data={data}
                width="100%"
                height="400px"
                legendToggle
            />
            <p>Stock purchase prediction: <d style={{color: prediction>0 ? "green" : "red"}}>{ prediction }</d></p>
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
    var prediction
    const cached = await new Promise((resolve) => connection.query("SELECT * FROM stockMeta WHERE ticker=?", [title], function (error, results, fields) {
        resolve(results)
    })).then((val => {
        if (val && val.length > 0) {
            prediction = parseFloat(val[0].prediction)
            return (parseInt(val[0].lastUpdate) == day)
        } else {
            prediction = 0
            return false
        }
    }))
    var stock = []
    if (! cached) {
        console.log(`Downloading data for stock ${title}`)
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
            connection2.query("INSERT INTO stockMeta VALUES(?, ?);", [title, day])
            connection2.query('DELETE FROM stocks WHERE ticker=?;', [title]);
            let queryStatement = "INSERT INTO stocks VALUES"
            let queryParams = []
            stock.forEach(element => {
                count ++;
                queryStatement += " (?, ?, ?),"
                queryParams.push(title)
                queryParams.push(count)
                queryParams.push(element)
            })
            connection2.query(queryStatement.slice(0, queryStatement.length-1), queryParams);
            console.log(`Finished saving stock data for ${title}`)
            connection2.end()
        }
    } else {
        // Gets the best bot to send to the client
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
    // Gets the historical data for the best bot.
    const botStrategy = await new Promise((resolve) => {
        connection.query("SELECT * FROM bot ORDER BY earnings DESC LIMIT 1", function (error, results2, fields) {
            if (results2 == undefined) {
                resolve([])
            } else {
                if (results2.length > 0) {
                    resolve(JSON.parse(results2[0].strategy))
                } else {
                    resolve([])
                }
            }
        })
    }).then((val => {return val}))
    connection.end();
    if (stock.length < 1) {
        return {
            notFound: true,
        }
    }
    return {
        props : {
            stock, title, botStrategy
        },
    }
}