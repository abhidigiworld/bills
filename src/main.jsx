import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import WelcomePage from './assets/component/Welcome.jsx'
import InvoiceForm from './assets/component/InvoiceForm.jsx'
import Login from './assets/component/Login.jsx'
import Bills from './assets/component/Bills.jsx'

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
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>,
)
