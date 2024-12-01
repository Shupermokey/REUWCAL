import React from 'react'
import { slide as Menu } from 'react-burger-menu'
import { useApp } from '../context/AppProvider';

function Sidebar() {

   const {base,setBase} = useApp();

  return (
    <Menu noOverlay className='left'>
        <div href="">Home</div>
        <div onClick={() => setBase(!base)}>Basic</div>
        <div href="">Third</div>
    </Menu>
  )
}

export default Sidebar