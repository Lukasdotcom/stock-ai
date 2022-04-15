import Link from 'next/link'
import searchStyles from '../styles/Search.module.css'
import { useState } from "react";

const Layout = () => {
    async function search(val) {
        var newSearchResult = []
        if (val) {
            const result = await fetch(`/api/search/${val}`)
            newSearchResult = await result.json()
        }
        setSearchResult(newSearchResult)
    }
    const [searchResult, setSearchResult] = useState([]);
    return (
    <>
        <wrapper className={searchStyles.wrapper}>
        <div className={searchStyles.searchInput}>
            <input type={"text"} placeholder={"Type Here to Search..."} onClick={(val) => {search(val.target.value)}} onChange={(val) => {search(val.target.value)}}></input>
            {searchResult.length > 0 ? <ul className={searchStyles.autocom}>
                {searchResult.map((result) => (<li onClick={() => {setSearchResult([])}} key={result.symbol}><Link href={`/stocks/${result.symbol}`}>{`${result.shortname} - ${result.symbol}`}</Link></li>))}
            </ul> : ""}
            
        </div>
        </wrapper>
    </>
    )
}

export default Layout