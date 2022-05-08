import { useState } from "react";
// This is the UI for creating a new task
export default function Layout() {
    const [prevName, setPrevName] = useState("")
    const [name, setName] = useState("")
    const [size, setSize] = useState(100)
    const [generations, setGenerations] = useState(100)
    const [generationSize, setGenerationSize] = useState(100)
    const [mutation, setMutation] = useState(0.3)
    const [saveInterval, setSaveInterval] = useState(5)
    return (
        <>
            <h1>Tasks</h1>
            <label htmlFor="prevName">Bot to get data from:</label>
            <input value={prevName} onChange={(val) => {setPrevName(val.target.value)}} id='prevName' type='text'></input>
            <br></br>
            <label htmlFor="name">Bot name:</label>
            <input value={name} onChange={(val) => {setName(val.target.value)}} id='name' type='text'></input>
            <br></br>
            <label htmlFor="size">Bot size:</label>
            <input value={size} onChange={(val) => {setSize(parseInt(val.target.value))}} id='size' type='number'></input>
            <br></br>
            <label htmlFor="generations">Bot generations:</label>
            <input value={generations} onChange={(val) => {setGenerations(parseInt(val.target.value))}} id='generations' type='number'></input>
            <br></br>
            <label htmlFor="generationSize">Generation population:</label>
            <input value={generationSize} onChange={(val) => {setGenerationSize(parseInt(val.target.value))}} id='generationSize' type='number'></input>
            <br></br>
            <label htmlFor="mutation">Mutation Strength:</label>
            <input value={mutation} onChange={(val) => {setMutation(parseFloat(val.target.value))}} id='mutation' type='number'></input>
            <br></br>
            <label htmlFor="saveInterval">Generations per save:</label>
            <input value={saveInterval} onChange={(val) => {setSaveInterval(parseInt(val.target.value))}} id='saveInterval' type='number'></input>
            <br></br>
            <button onClick={() => {
                // This is used to create the task on the server
                fetch('/api/tasks', {
                    method: 'POST',
                    headers:{
                        'Content-Type':'application/json'
                    },
                    body: JSON.stringify({
                        "prevName" : prevName,
                        "name" : name,
                        "size" : size,
                        "generations" : generations,
                        "generationSize" : generationSize,
                        "mutation" : mutation,
                        "saveInterval" : saveInterval
                    })
                }).then((response) => {if (!response.ok) {alert("Could not create task")}})
            }}>Create Task</button>
        </>
    )
}