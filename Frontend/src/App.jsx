import React from 'react'
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import Login from './Pages/Login'
import Signup from './Pages/Signup'
import Dashboard from './Pages/Dashboard'
import Delivery from './Pages/Delivery'
import Results from './Pages/Results'
import AdminPanel from './Pages/AdminPanel'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Login/> }></Route>
        <Route path='/login' element={<Login/> }></Route>
        <Route path='/signup' element={<Signup/> }></Route>
        <Route path='/dashboard' element={<Dashboard/> }></Route>
        <Route path='/deliveries' element={<Delivery/> }></Route>
        <Route path='/history' element={<Results/> }></Route>
        <Route path='/admin' element={<AdminPanel/> }></Route>
      </Routes>
    </Router>
  )
}

export default App
