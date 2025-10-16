import React from 'react'
import "@/styles/components/Footer.css";


function LoginFooter() {
  return (
    <footer className="footer">
  <div className="footer-container">
    <div className="footer-about">
      <h2>RETVM</h2>
      <p>Connecting people with the best subscription plans. Subscribe today to unlock premium features!</p>
    </div>
    <div className="footer-links">
      <h3>Quick Links</h3>
      <ul>
        <li><a href="/about">About Us</a></li>
        <li><a href="/pricing">Pricing</a></li>
        <li><a href="/blog">Blog</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </div>
    <div className="footer-social">
      <h3>Follow Us</h3>
      <div className="social-icons">
        <a href="https://facebook.com" target="_blank" aria-label="Facebook">
          <i className="fab fa-facebook"></i>
        </a>
        <a href="https://twitter.com" target="_blank" aria-label="Twitter">
          <i className="fab fa-twitter"></i>
        </a>
        <a href="https://instagram.com" target="_blank" aria-label="Instagram">
          <i className="fab fa-instagram"></i>
        </a>
        <a href="https://linkedin.com" target="_blank" aria-label="LinkedIn">
          <i className="fab fa-linkedin"></i>
        </a>
      </div>
    </div>
  </div>
  <div className="footer-bottom">
    <p>&copy; 2025 RETVM. All rights reserved.</p>
  </div>
</footer>

  )
}

export default LoginFooter