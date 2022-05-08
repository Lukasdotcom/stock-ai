import Head from 'next/head'
import Login from '../components/Login'
import { SessionProvider, getSession } from "next-auth/react"
import TaskCreater from "../components/TaskCreator"
import TrainingDataCreator from "../components/TrainingDataCreator"
import TaskList from "../components/TaskList"

export default function Home({...pageProps}) {
    return (
    <>
        <Head>
            <title>Admin</title>
        </Head>
        <div style={{"width" : "50%","float" : "left" }}>
            <h1>Admin Panel</h1>
            <SessionProvider session={pageProps.session}>
                <Login />
            </SessionProvider>
            {pageProps.session && 
            <>
            <p>Tasks are run with data under the training data center.</p>
            <TaskCreater />
            <TaskList />
            </>
            }
        </div>
        {pageProps.session && 
        <div style={{"width" : "50%", "float" : "right"}}>
            <TrainingDataCreator />
        </div>
        }
    </>
  )
}

// Gets the users session
export async function getServerSideProps(ctx) {
    return {
        props: {
            session: await getSession(ctx)
        },
    }
}