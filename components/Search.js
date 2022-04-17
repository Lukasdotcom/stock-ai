import Link from 'next/link'
import searchStyles from '../styles/Search.module.css'
import { useState } from "react";

const Layout = () => {
    async function search(val) {
        // Makes sure that only a small list of characters are allowed to make bugs less rare
        val = val.replace(/[^a-z0-9\^]/gi, "")
        var newSearchResult = []
        const same = val == searchTerm
        setNewSearchTerm(val)
        if (val && val != "" && ! same) {
            const result = await fetch(`/api/search/${val}`)
            newSearchResult = await result.json()
        }
        setSearchResult(newSearchResult)
    }
    const [searchResult, setSearchResult] = useState([]);
    const [searchTerm, setNewSearchTerm] = useState("DUMMY");
    return (
    <>
        <wrapper className={searchStyles.wrapper}>
        <div className={searchStyles.searchInput}>
            <input type={"text"} value={searchTerm} placeholder={"Type Here to Search..."} onClick={(val) => {search(val.target.value)}} onChange={(val) => {search(val.target.value)}}></input>
            {searchResult.length > 0 ? <ul className={searchStyles.autocom}>
                {searchResult.map((result) => (<li onClick={() => {setSearchResult([])}} key={result.symbol}><Link href={`/stocks/${result.symbol}`}>{`${result.shortname} - ${result.symbol}`}</Link></li>))}
            </ul> : ""}
            
        </div>
        </wrapper>
    </>
    )
}

export default Layout