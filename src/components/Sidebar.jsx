import React from 'react'
import { slide as Menu } from 'react-burger-menu'

function Sidebar() {
  return (
    <Menu noOverlay>
        <a href="">Home</a>
        <a href="">Basic</a>
        <a href="">Third</a>
    </Menu>
  )
}

export default Sidebar