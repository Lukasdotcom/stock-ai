import { signIn, signOut, useSession } from "next-auth/react"

export default function Layout() {
    const { data: session } = useSession()
    if (! session) {
        return (
            <>
                <h2>Sign In Here</h2>
                <button onClick={signIn}>Sign in</button>
            </>
        )
    } else {
        return (
            <>
                <h2>You are signed in</h2>
                <button onClick={signOut}>Sign out</button>
            </>
        )
    }
    
}
