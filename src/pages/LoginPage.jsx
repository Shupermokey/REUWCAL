import React from 'react'
import Login from '../components/Auth/Login'

function LoginPage() {
  return (
    <>
    <div>Login Page</div>
      <Login />
      <a href='/register'>Register</a>
    </>
  )
}

export default LoginPage