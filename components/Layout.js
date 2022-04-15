import Menu from './Menu'

const Layout = ({ children }) => {
  return (
    <>
    <main>
        <Menu />
        {children}
    </main>
    </>
  )
}

export default Layout