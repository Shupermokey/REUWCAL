import React from 'react'

function LoginFooter() {
  return (
    <footer class="footer">
  <div class="footer-container">
    <div class="footer-about">
      <h2>RETVM</h2>
      <p>Connecting people with the best subscription plans. Subscribe today to unlock premium features!</p>
    </div>
    <div class="footer-links">
      <h3>Quick Links</h3>
      <ul>
        <li><a href="/about">About Us</a></li>
        <li><a href="/pricing">Pricing</a></li>
        <li><a href="/blog">Blog</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </div>
    <div class="footer-social">
      <h3>Follow Us</h3>
      <div class="social-icons">
        <a href="https://facebook.com" target="_blank" aria-label="Facebook">
          <i class="fab fa-facebook"></i>
        </a>
        <a href="https://twitter.com" target="_blank" aria-label="Twitter">
          <i class="fab fa-twitter"></i>
        </a>
        <a href="https://instagram.com" target="_blank" aria-label="Instagram">
          <i class="fab fa-instagram"></i>
        </a>
        <a href="https://linkedin.com" target="_blank" aria-label="LinkedIn">
          <i class="fab fa-linkedin"></i>
        </a>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <p>&copy; 2025 RETVM. All rights reserved.</p>
  </div>
</footer>

  )
}

export default LoginFooter