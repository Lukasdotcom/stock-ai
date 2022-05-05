import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import {admin_password} from "../../../enviromental.mjs"

const options = {
  // Configure one or more authentication providers
  providers: [
    Credentials({
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: "Credentials",
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        password: { label: "Password", type: "password" },
      },
      // Used to make sure that the credentails are correct
      authorize: async (credentials) => {
        if (admin_password === credentials.password) {
            const user = { id: 1, name: "Admin" }
            return Promise.resolve(user)
        } else {
            return Promise.resolve("")
        }
      },
    }),
  ],
}

export default (req, res) => NextAuth(req, res, options)