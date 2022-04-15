import Chart from "react-google-charts";
import { parse } from "csv-parse";
import { predict, simulateBot } from "../../botSim.mjs"
import Head from 'next/head'
import { useState } from "react";

// Creates a simple graph with all the prices of the stock
function Graph( { title, stock, botStrategy, specificBotStrategy, startGraphSize } ) {
    let data = [["Date", "Stock Price", "Bot", "Specific Bot"]]
    let count = 0
    const prediction = predict(botStrategy, stock.length, stock)
    const specificPrediction = predict(specificBotStrategy, stock.length, stock)
    const [graphSize, setGraphSize] = useState(startGraphSize);
    // Makes sure that the graph has a valid value for its starting value
    const actualGraphSize = graphSize < stock.length ? (graphSize < 1 ? 1 : graphSize) : stock.length - 1
    // Calculates the simple bots values
    var bot = Array(actualGraphSize).fill(0)
    if (botStrategy.length > 0) {
        bot = simulateBot(stock.length-actualGraphSize, stock, botStrategy)
    }
     // Calculates the specific bots values
    var specificBot = Array(actualGraphSize).fill(0)
    if (specificBotStrategy.length > 0) {
        specificBot = simulateBot(stock.length-actualGraphSize, stock, specificBotStrategy)
    }
    // Takes out the unneccessary stock value
    var stock2 = stock.slice(-actualGraphSize)
    stock2.forEach(element => {
        data.push([count, element, bot.length > count ? bot[count] : 0, specificBot.length > count ? specificBot[count] : 0])
        count ++
    })
    return (
        <>
            <Head>
                <title>{title}</title>
            </Head>
            <h1 style={{height: "80px"}}>{title}</h1>
            <Chart
                chartType="LineChart"
                data={data}
                width="100%"
                height="400px"
                legendToggle
            />
            <h3>Set Number of Days for Graph</h3>
            <p>Warning it is very laggy when you scroll very far to the right side on the slider. Please click on the slider and don&apos;t slide.</p>
            <input type={"range"} style={{width: "100%"}} min={1} value={actualGraphSize} max={stock.length - 1} onChange={(val) => {setGraphSize(val.target.valueAsNumber)}}></input>
            <p>Stock purchase prediction: <d style={{color: prediction>0 ? "green" : "red"}}>{ prediction }</d></p>
            <p>Specific stock purchase prediction: <d style={{color: specificPrediction>0 ? "green" : "red"}}>{ specificPrediction }</d></p>
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
    // Gets the specific bot strategy
    const specificBotStrategy = await new Promise((resolve) => {
        connection.query("SELECT * FROM stockMeta WHERE ticker=?", [title], function (error, results2, fields) {
            if (results2 == undefined) {
                resolve([])
            } else {
                if (results2.length > 0) {
                    resolve(JSON.parse(results2[0].bestBot))
                } else {
                    resolve([])
                }
            }
        })
    }).then((val => {return val}))
    // Gets the best bot.
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
            connection2.query("INSERT INTO stockMeta VALUES(?, ?, ?);", [title, day, "[]"])
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
        // Gets the stock data
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
    const startGraphSize = 500
    return {
        props : {
            stock, title, botStrategy, specificBotStrategy, startGraphSize,
        },
    }
}
export default Graph