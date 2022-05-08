import { useState, useEffect } from "react";
// This is the UI for a single selection
function TrainData({ ticker, start, end, botName, update }) {
    const [ticker2, setTicker] = useState(ticker)
    const [start2, setStart] = useState(start)
    const [end2, setEnd] = useState(end)
    return (
        <>
        <br></br>
        <label htmlFor="ticker">Stock Ticker:</label>
        <input value={ticker2} onChange={(val) => {setTicker(val.target.value)}} id='ticker' type='text'></input>
        <br></br>
        <label htmlFor="start">Start Time:</label>
        <input value={start2} onChange={(val) => {setStart(parseInt(val.target.value))}} id='start' type='number'></input>
        <br></br>
        <label htmlFor="end">End Time:</label>
        <input value={end2} onChange={(val) => {setEnd(parseInt(val.target.value))}} id='end' type='number'></input>
        <br></br>
        <button onClick={async () => {
            // The Save/Create Button
            await fetch(`/api/trainData/${botName}`, {
                method: 'PUT',
                headers:{
                    'Content-Type':'application/json'
                },
                body: JSON.stringify({
                    "old" : {
                        "ticker" : ticker,
                        "start" : start,
                        "end" : end
                    },
                    "new" : {
                        "ticker" : ticker2,
                        "start" : start2,
                        "end" : end2
                    }
                })
            }).then((response) => {if(!response.ok) {alert("Failed to save strategy")}})
            getTrainData(botName, update)
        }}>Save</button>
        {! (start == end) &&
        <>
        <button className="red-button" onClick={async () => {
            // The delete button
            await fetch(`/api/trainData/${botName}`, {
                method: 'DELETE',
                headers:{
                    'Content-Type':'application/json'
                },
                body: JSON.stringify({
                    "ticker" : ticker2,
                    "start" : start2,
                    "end" : end2
                })
            }).then((response) => {if(!response.ok) {alert("Failed to delete strategy")}})
            getTrainData(botName, update)
        }}>Delete</button>
        <br></br>
        </>
        }
        </>
    )
}
// Gets the training data for the bot
async function getTrainData(botName, stateSet) {
    stateSet(await fetch(`/api/trainData/${botName}`).then((val) => {return val.json()}).then((val) => {return val}))
}
// This is the UI for editing the training data
export default function Layout() {
    const [botName, setBotName] = useState("")
    const [trainData, setTrainData] = useState([{"name":"Sample","ticker":"WM","start":12,"end":300}])
    // Does a search the first 
    useEffect(() => {
        getTrainData("", setTrainData)
        return () => {};
      }, []);
    let key = 0
    return (
        <>
            <h1>Training Data</h1>
            <p style={{"color" : "red"}}>Warning duplicated entries do not work here!</p>
            <label htmlFor="name">Bot Name</label>
            <input value={botName} id='name' type="text" onChange={(val) => {setBotName(val.target.value); getTrainData(val.target.value, setTrainData);}}></input>
            <br></br>
            {trainData.map((val) => {
                // Shows every training data for every row
                key ++
                return <TrainData key={key} ticker={val.ticker} start={val.start} end={val.end} botName={botName} update={setTrainData}/>
            })}
            <TrainData ticker={""} start={0} end={0} botName={botName} update={setTrainData}/>
        </>
    )
}
