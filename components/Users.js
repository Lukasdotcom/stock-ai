import { useState, useEffect } from "react"
// Fetchs a list of all the users
async function getUsers(setState) {
    let data = await fetch('/api/users')
    data = await data.json()
    setState(data)
}
function User({ email, updateUserList }) {
    return (
        <p>{email}<button onClick={ async () => {
            await fetch("/api/users", {
                method: 'DELETE',
                headers:{
                    'Content-Type':'application/json'
                },
                body: JSON.stringify({
                    "email" : email
                })
            }).then((response) => {if(!response.ok) {alert("Failed to delete user")}})
            updateUserList()}}>Delete User</button></p>
    )
}
export default function Layout() {
    const [users, setUsers] = useState([])
    const [email, setEmail] = useState("")
    useEffect(() => {
        getUsers(setUsers)
        return () => {}
      }, [])
    return (
        <>
        <h1>Users</h1>
        <p>This is a list of users you want to have be allowed to sign in with google. You must have enabled sign in with google in the enviromental variables to enable this</p>
        {users.map((val) => 
            <User key={val.email} email={val.email} updateUserList={() => {getUsers(setUsers)}}/>
            )
        }
        <label htmlFor="email">Email:</label>
        <input value={email} onChange={(val) => {setEmail(val.target.value)}} id="email" type="email"></input>
        <button onClick={async () => {
            await fetch("/api/users", {
                method: 'POST',
                headers:{
                    'Content-Type':'application/json'
                },
                body: JSON.stringify({
                    "email" : email
                })
            }).then((response) => {if(!response.ok) {alert("Failed to add user")}})
            getUsers(setUsers)
            setEmail("")}}>Add User</button>
        </>
    )
}
