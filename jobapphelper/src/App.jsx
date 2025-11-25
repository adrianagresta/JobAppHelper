import React from 'react'
import './App.css'

import Layout from './components/structure/Layout'
import Header from './components/structure/Header'
import Menu from './components/structure/Menu'
import Sidebar from './components/structure/Sidebar'
import Content from './components/structure/Content'
import Footer from './components/structure/Footer'

function App() {
  return (
    <Layout title="JobAppHelper" header={<Header/>} menu={<Menu/>} sidebar={<Sidebar/>} footer={<Footer/>}>
      <Content>
        <h2>Dashboard</h2>
        <p>This is a scaffolded layout. Replace with your content.</p>
      </Content>
    </Layout>
  )
}

export default App
