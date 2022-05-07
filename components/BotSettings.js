import { useState } from "react";
// This is used to save the preffered bot in the database
async function saveStrategy(botName, botLevel, stock) {
    fetch(`/api/stock/${stock}`, {
        method: 'PUT',
        headers:{
            'Content-Type':'application/json'
        },
        body: JSON.stringify({
            "botName" : botName,
            "botLevel" : botLevel,
        })
    })
}
export default function Layout({changeStrategy, strategies, stock}) {
    const [botLevel, setBotLevel] = useState(0)
    const [botName, setBotName] = useState('')
    return (
        <>
            <label for="bot">Bot type:</label>
            <select id='bot' onChange={(val) => {setBotLevel(parseInt(val.target.value))}}>
                <option value='0'>Primary Bot</option>
                <option value='1'>Secondary Bot</option>
                <option value='2'>Tertiary Bot</option>
            </select>
            <br></br>
            <label for="botName">Bot name:</label>
            <input id='botName' onChange={(val) => {setBotName(val.target.value)}}>
            </input>
            <button onClick={(val) => {changeStrategy(botName, strategies[botLevel]); saveStrategy(botName, botLevel, stock)}}>Save</button>
        </>
    )
}
