import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>Stock AI</title>
      </Head>
      <h1>Welcome to Stock AI</h1>
      <p>Hi you can look at every stock and see the data for it. You will also be able to see a purchase prediction for the stock. This purchase prediction simply means when it is positive you multiply it by your cash reserves and buy that much stock and if it is negative you multiply the number by the amount of stock you have and sell that much stock. There will be 2 values for each stock. The specific one is the last one that was trained on that stock specifically while the non specific one is just the latest bot trained.</p>
    </>
  )
}
