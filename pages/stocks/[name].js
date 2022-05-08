import {mysql_host, mysql_database, mysql_user, mysql_password} from "../../enviromental"
import { parse } from "csv-parse";
import { predict, simulateBot } from "../../botSim.mjs"
import Head from 'next/head'
import { useEffect, useState } from "react";
import { 
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { getSession } from "next-auth/react"
import BotSettings from "../../components/BotSettings"
import { Line } from 'react-chartjs-2';
ChartJS.register(
CategoryScale,
LinearScale,
PointElement,
LineElement,
Title,
Tooltip,
Legend
);
// Function that will update the strategy in the UI botName is the new name of the bot and setState is which bot it is
async function getStrategy(botName, stateSet) {
    stateSet(await fetch(`/api/strategy/${botName}`).then((val) => {return val.json()}).then((val) => {return val}))
}
// Creates a simple graph with all the prices of the stock
function Graph( { title, stock, startGraphSize, session, botNames } ) {
    const [primaryBotStrategy, setPrimaryBotStrategy] = useState([]);
    const [secondaryBotStrategy, setSecondaryBotStrategy] = useState([]);
    const [tertiaryBotStrategy, setTertiaryBotStrategy] = useState([]);
    // Makes sure to get the data for all the bots
    useEffect(() => {
        getStrategy(botNames[0], setPrimaryBotStrategy);
        getStrategy(botNames[1], setSecondaryBotStrategy);
        getStrategy(botNames[2], setTertiaryBotStrategy);
        return () => {};
      }, []);
    const primaryPrediciton = predict(primaryBotStrategy, stock.length, stock)
    const secondaryPrediction = predict(secondaryBotStrategy, stock.length, stock)
    const tertiaryPrediction = predict(tertiaryBotStrategy, stock.length, stock)
    const [graphSize, setGraphSize] = useState(startGraphSize)
    // Makes sure that the graph has a valid value for its starting value
    const actualGraphSize = graphSize < stock.length ? (graphSize < 1 ? 1 : graphSize) : stock.length - 1
    // Calculates the primary bots values
    var primaryBot = Array(actualGraphSize).fill(0)
    if (primaryBotStrategy.length > 0) {
        primaryBot = simulateBot(stock.length-actualGraphSize, stock, primaryBotStrategy)
    }
    // Calculates the secondary bots values
    var secondaryBot = Array(actualGraphSize).fill(0)
    if (secondaryBotStrategy.length > 0) {
        secondaryBot = simulateBot(stock.length-actualGraphSize, stock, secondaryBotStrategy)
    }
    // Calculates the tertiary bots values
    var tertiaryBot = Array(actualGraphSize).fill(0)
    if (tertiaryBotStrategy.length > 0) {
        tertiaryBot = simulateBot(stock.length-actualGraphSize, stock, tertiaryBotStrategy)
    }
    // Takes out the unneccessary stock value
    var stock2 = stock.slice(-actualGraphSize)
    var labels = []
    let count = 0
    var primaryBotRatio = []
    var secondaryBotRatio = []
    var tertiaryBotRatio = []
    // Calculates the rato of stock price to bot value
    stock2.forEach(element => {
        labels.push(count)
        primaryBotRatio.push(primaryBot[count] / element)
        secondaryBotRatio.push(secondaryBot[count] / element)
        tertiaryBotRatio.push(tertiaryBot[count] /element)
        count ++
    })
    const data = {
        labels: labels,
        datasets: [{
            label : "Stock Price",
            backroundColor: 'rgb(255,0,0)',
            borderColor: 'rgb(255,0,0)',
            pointRadius: 0,
            data: stock2
        },
        {
            label : "Primary Bot",
            backroundColor: 'rgb(0,255,0)',
            borderColor: 'rgb(0,255,0)',
            pointRadius: 0,
            data: primaryBot
        },
        {
            label : "Secondary Bot Bot",
            backroundColor: 'rgb(0,255,255)',
            borderColor: 'rgb(0,255,255)',
            pointRadius: 0,
            data: secondaryBot
        },
        {
            label : "Tertiary Bot",
            backroundColor: 'rgb(0,0,255)',
            borderColor: 'rgb(0,0,255)',
            pointRadius: 0,
            data: tertiaryBot
        }
        ]
    }
    const data2 = {
        labels: labels,
        datasets: [
            {
                label : "Primary Bot",
                backroundColor: 'rgb(0,255,0)',
                borderColor: 'rgb(0,255,0)',
                pointRadius: 0,
                data: primaryBotRatio
            },
            {
                label : "Secondary Bot Bot",
                backroundColor: 'rgb(0,255,255)',
                borderColor: 'rgb(0,255,255)',
                pointRadius: 0,
                data: secondaryBotRatio
            },
            {
                label : "Tertiary Bot",
                backroundColor: 'rgb(0,0,255)',
                borderColor: 'rgb(0,0,255)',
                pointRadius: 0,
                data: tertiaryBotRatio
            }
        ]
    }
    const options = {
        animations: false
      }
    return (
        <>
            <Head>
                <title>{title}</title>
            </Head>
            <h1 style={{height: "80px"}}>{title}</h1>
            <h2>Stock Price and Bot Value</h2>
            <Line
                data={data}
                options={options}
                height="50px"
                
            />
            <h2>Ratio of Stock Price to Bot Values</h2>
            <Line
                data={data2}
                options={options}
                height="50px"
                
            />
            <h3>Set Number of Days for Graph</h3>
            <p>Warning it is very laggy when you scroll very far to the right side on the slider. Please click on the slider and don&apos;t slide.</p>
            <input type={"range"} style={{width: "100%"}} min={1} value={actualGraphSize} max={stock.length - 1} onChange={(val) => {setGraphSize(val.target.valueAsNumber)}}></input>
            <p>Primary Bot or bot  purchase prediction: <d style={{color: primaryPrediciton>0 ? "green" : "red"}}>{ primaryPrediciton }</d></p>
            <p>Secondary Bot purchase prediction: <d style={{color: secondaryPrediction>0 ? "green" : "red"}}>{ secondaryPrediction }</d></p>
            <p>Tertiary Bot purchase prediction: <d style={{color: tertiaryPrediction>0 ? "green" : "red"}}>{ tertiaryPrediction }</d></p>
            {session &&
                // This is used to allow an admin to change the bots being used
                <>
                <h3>Change Bot being used</h3>
                <p>To update please reload the page</p>
                <BotSettings changeStrategy={getStrategy} strategies={[setPrimaryBotStrategy, setSecondaryBotStrategy, setTertiaryBotStrategy]} stock={title} botNames={botNames} />
                </>
            }
        </>
    )
  }

export async function getServerSideProps(context, res) {
    const day = Math.floor(Date.now() / 1000 / 3600 / 24)
    const title = context.params.name
    var mysql = require('mysql');
    var connection = mysql.createConnection({
        host     : mysql_host,
        user     : mysql_user,
        password : mysql_password,
        database : mysql_database
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
    // Gets all the bot strategies
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
                host     : mysql_host,
                user     : mysql_user,
                password : mysql_password,
                database : mysql_database
                });
            // Adds the data to the database
            let count = 0
            connection2.query("INSERT INTO stockMeta VALUES (?, ?, '', '', '') ON DUPLICATE KEY UPDATE lastUpdate=?;", [title, day, day])
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
    // Gets the bot data
    const botNames = await new Promise((resolve) => {
        connection.query("SELECT * FROM stockMeta WHERE ticker=?", [title], function (error, results2, fields) {
            if (results2.length > 0) {
                resolve([results2[0].primaryBot, results2[0].secondaryBot, results2[0].tertiaryBot])
            } else {
                resolve()
            }
        })
    }).then(async function(val) {
        if (val == undefined) {
            return [[], [], []]
        } else {
            return val
        }
    })
    connection.end();
    if (stock.length < 1) {
        return {
            notFound: true,
        }
    }
    const startGraphSize = 500
    return {
        props : {
            stock, title, botNames, startGraphSize, session : await getSession(context),
        },
    }
}
export default Graph