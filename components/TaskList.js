import { useState, useEffect } from "react";
import { Line } from 'rc-progress'
// UI for a single task
function Task({ percent, name, inProgress, generations}) {
    return (
        <>
        <br></br>
        <br></br>
        <h3>Task: {name}</h3>
        <p>Progress: {Math.round(percent * generations)}/{generations}</p>
        <Line strokeWidth={4} percent={percent*100} strokeColor="rgb(0, 0, 255)" />
        { inProgress==1 &&
            <p style={{"font-size" : "15px"}}>In progress</p>
        }
        </>
    )
}
// This is the UI for showing all the tasks
export default function Layout() {
    const [tasks, setTasks] = useState([])
    // Makes sure to update the data every second
    useEffect(() => {
        const interval = setInterval(async () => {
            let data = await fetch('/api/tasks')
            setTasks(await data.json())
        }, 1000)
        return () => {
          clearInterval(interval);
        };
      }, []);
    return (
        <>
        {tasks.map((element) => 
            // Creates an element for every task
            <Task inProgress={element.inUse} percent={element.progress} name={element.botName} key={element.botName} generations={element.generations}/>
        )}
        </>
    )
}