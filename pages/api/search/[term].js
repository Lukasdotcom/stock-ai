export default async function handler({ query: { term } }, res) {
    const result = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${term}&lang=en-US&region=US&quotesCount=3&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query&multiQuoteQueryId=multi_quote_single_token_query`)
    const search = await result.json()
    res.status(200).json(search.quotes)
}