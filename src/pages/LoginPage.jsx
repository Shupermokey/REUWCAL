import React from 'react'
import Login from '../components/Auth/Login'
import Logo from '../components/LoginPage/Logo'
import Tier from '../components/Pricing/Tier'

function LoginPage() {
  return (
    <div className='login-page-container'>
      <div className='login-page-top'>
      <Logo />


      <div>
      <Login />
      <a className='register-btn' href='/register'>Register</a>
      </div>

      </div>

      <div className='tier-container'>
        <Tier level={"free"} />
        <Tier level={"market"} />
        <Tier level={"developer"} />
        <Tier level={"syndicator"} />
      </div>
      
    </div>
  )
}

export default LoginPage