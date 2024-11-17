import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import WelcomePage from './assets/component/Welcome.jsx'
import InvoiceForm from './assets/component/InvoiceForm.jsx'
import Login from './assets/component/Login.jsx'
import Bills from './assets/component/Bills.jsx'
import AddEmployee from './assets/component/AddEmployee.jsx'
import SalarySlip from './assets/component/SalarySlip.jsx'
import ErrorPage from './assets/component/ErrorPage.jsx'

const router= createBrowserRouter([
  {
    path: '/',
    element: <Login/>
  },
  {
    path: '/Main',
    element : <WelcomePage/>
  },
  {
    path: '/existing-bills',
    element: <Bills/>
  },
  {
    path: '/new-bill',
    element: <InvoiceForm/>
  },
  {
    path: '/new-employee',
    element: <AddEmployee/>
  },
  {
    path: '/new-Salary',
    element: <SalarySlip/>
  },
  {
    path: '*',
    element : <ErrorPage/>
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>,
)
