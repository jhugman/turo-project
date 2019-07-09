import React from 'react'
import logo from './logo.svg'
import styles from './Nav.module.css'

export default function Nav() {
  return <nav className={styles.nav}>
    <img className={styles.logo} src={logo} alt="Logo" />
  </nav>
}