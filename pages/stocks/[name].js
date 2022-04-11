import Chart from "react-google-charts";
import { parse } from "csv-parse";
import { simulateBestBotStock, predict } from "../../botSim.mjs"
import Head from 'next/head'

// Creates a simple graph with all the prices of the stock
export default function Graph( { title, stock, bestBot, prediction, newPrediction } ) {
    let data = [["Date", "Stock Price", "Bot"]]
    let count = 0
    stock.forEach(element => {
        data.push([count, element, bestBot.length > count ? bestBot[count] : 0])
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
            <p>Stock purchase prediction in graph above is(Only updates every day): <d style={{color: prediction>0 ? "green" : "red"}}>{ prediction }</d></p>
            <p>Stock purchase prediction for latest bot is(Updates every load): <d style={{color: newPrediction>0 ? "green" : "red"}}>{ newPrediction }</d></p>
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
            try {
                connection2.query("DELETE FROM stockMeta WHERE ticker=?;",[title])
                connection2.query("INSERT INTO stockMeta VALUES(?, ?, ?, ?);", [title, day, 1, 0])
                connection2.query('DELETE FROM stocks WHERE ticker=?;', [title]);
                let queryStatement = "INSERT INTO stocks VALUES"
                let queryParams = []
                stock.forEach(element => {
                    count ++;
                    queryStatement += " (?, ?, ?, ?),"
                    queryParams.push(title)
                    queryParams.push(count)
                    queryParams.push(element)
                    queryParams.push(0)
                })
                connection2.query(queryStatement.slice(0, queryStatement.length-1), queryParams);
                console.log(`Finished saving stock data for ${title}`)
            } catch (err) {
                connection2.query('DELETE FROM stockMeta WHERE ticker=?;', [title]);
                console.log(`Failed to save stockData for ${title} with error; ${err}`)
            }
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
    // Gets the historical data for the best bot.
    const newPrediction = await new Promise((resolve) => {
        connection.query("SELECT * FROM bot ORDER BY earnings DESC LIMIT 1", function (error, results2, fields) {
            if (results2 == undefined) {
                resolve(0)
            } else {
                if (results2.length > 0) {
                    resolve(predict(JSON.parse(results2[0].strategy), stock.length, stock))
                } else {
                    resolve(0)
                }
            }
        })
    }).then((val => {return val}))
    var bestBot = []
    bestBot = await new Promise((resolve) => {
        connection.query("SELECT * FROM stocks WHERE ticker=? ORDER BY time ASC", [title], function (error, results2, fields) {
            let bestBot = []
            let record = results2 ? results2 : []
            record.forEach(element => {
                bestBot.push(parseFloat(element.bestBot))
            })
            resolve(bestBot)
        })
    }).then((val => {return val}))
    connection.end();
    if (stock.length < 1) {
        return {
            notFound: true,
        }
    } else {
        // Checks if the best bot needs to be updated
        simulateBestBotStock(title, stock)
    }
    return {
        props : {
            stock, title, bestBot, prediction, newPrediction
        },
    }
}