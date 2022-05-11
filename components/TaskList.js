import { useState, useEffect } from "react";
import { Line } from 'rc-progress'
// UI for a single task
function Task({ percent, name, inProgress, generations, timeEstimate}) {
    let seconds = Math.ceil(timeEstimate % 60)
    let minutes = Math.floor((timeEstimate % 3600)/60)
    let hours = Math.floor((timeEstimate % 86400)/3600)
    let days = Math.floor(timeEstimate/86400)
    return (
        <>
        <br></br>
        <br></br>
        <h3>Task: {name}</h3>
        <p>Progress: {Math.round(percent * generations)}/{generations}</p>
        <Line strokeWidth={4} percent={percent*100} strokeColor="rgb(0, 0, 255)" />
        { inProgress==1 &&
            <p>{days} days {hours} h {minutes} min {seconds} sec</p>
        }
        <button onClick={() => {
            /*Button used to cancel task*/
            fetch('/api/tasks', {
                method : "DELETE",
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({"name" : name})
            })}}className="red-button">Cancel</button>
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
            <Task inProgress={element.inUse} timeEstimate={ /*This calculates the amount of seconds left for the task*/(1-element.progress)*element.generations/element.saveInterval*element.previousTimeInterval} percent={element.progress} name={element.botName} key={element.botName} generations={element.generations}/>
        )}
        </>
    )
}