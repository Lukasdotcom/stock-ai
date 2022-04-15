import Link from 'next/link'
import navStyles from '../styles/Nav.module.css'
import Search from './Search'

const Layout = () => {
    return (
        <nav className={navStyles.nav}>
            <Link href='/'>Home</Link>
            <Search />
        </nav>
    )
}

export default Layout