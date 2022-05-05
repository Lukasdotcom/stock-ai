import Head from 'next/head'
import Login from '../components/Login'
import { SessionProvider, getSession } from "next-auth/react"

export default function Home({...pageProps}) {
  console.log(pageProps.session)
  return (
    <>
      <Head>
        <title>Admin</title>
      </Head>
      <h1>Admin Panel</h1>
      <SessionProvider session={pageProps.session}>
        <Login />
      </SessionProvider>
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