import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import GoogleProvider from 'next-auth/providers/google'
import {admin_password, google_id, google_secret, mysql_host, mysql_user, mysql_password, mysql_database} from "../../../enviromental.mjs"

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
    GoogleProvider({
      clientId: google_id,
      clientSecret: google_secret,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Will make sure that if this was sign in with google only a valid user logged in.
      if (account.provider === "google") {
        return profile.email_verified && await new Promise((resolve) => {
          var mysql = require('mysql');
          var connection = mysql.createConnection({
            host     : mysql_host,
            user     : mysql_user,
            password : mysql_password,
            database : mysql_database
            });
          connection.query("SELECT email FROM users WHERE email=?", [profile.email], function(error, results, fields) {
            resolve(results)
          })
        }).then((val) => {
          return (val.length > 0)
        })
      }
      return true // Do different verification for other providers that don't have `email_verified`
    },
  }
}

export default (req, res) => NextAuth(req, res, options)