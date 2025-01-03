import React from 'react'
import { slide as Menu } from 'react-burger-menu'
import { useApp } from '../context/AppProvider';

function Sidebar() {

   const {base,setBase} = useApp();

  return (
    <Menu noOverlay className='left'>
        <a href="/home">Home</a>
        {/* <div onClick={() => setBase(!base)}>Basic</div> */}
        <a href="/baseline">Basic</a>
        <a href="/pricing">Pricing</a>
        <a href="/dashboard">Dash</a>
    </Menu>
  )
}

export default Sidebar