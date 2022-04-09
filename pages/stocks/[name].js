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
    const title = context.params.name
    const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/download/${title}?period1=0&period2=2229456811&interval=1d&events=history&includeAdjustedClose=true`)
    // Reads the csv file
    var stock = []
    const parser = parse(await response.text(), {
        columns: true,
        skip_empty_lines: true
    })
    for await (const record of parser) {
        stock.push(parseFloat(record["Close"]))
    }
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