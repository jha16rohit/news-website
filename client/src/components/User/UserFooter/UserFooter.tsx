import React from "react";
import { Facebook, Instagram, Youtube, Mail } from "lucide-react";
import { FaXTwitter } from 'react-icons/fa6';
import logo from "../../../assets/Logo.png"; // 👈 Import your logo here!
import "./UserFooter.css";

const Footer: React.FC = () => {
  return (
    <footer className="footer-section">
      <div className="footer-container">
        
        {/* Top Grid Area */}
        <div className="footer-grid">
          
          {/* Column 1: Brand & Socials */}
          <div className="footer-col brand-col">
            
            {/* 👇 REPLACED THE TEXT WITH YOUR LOGO IMAGE 👇 */}
            <div className="footer-logo">
              <a href="/">
                <img src={logo} alt="Local Newz Logo" className="footer-logo-img" />
              </a>
            </div>

            <p className="footer-desc">
              India's trusted source for breaking news, in-depth analysis, and comprehensive coverage of events that matter to you.
            </p>
            <div className="social-icons">
              <a href="#" className="social-link"><Facebook size={18} /></a>
              <a href="#" className="social-link"><FaXTwitter size={18} /></a>
              <a href="#" className="social-link"><Instagram size={18} /></a>
              <a href="#" className="social-link"><Youtube size={18} /></a>
            </div>
          </div>

          {/* Column 2: Categories */}
          <div className="footer-col">
            <h3>Categories</h3>
            <ul>
              <li><a href="#">Politics</a></li>
              <li><a href="#">Business</a></li>
              <li><a href="#">Sports</a></li>
              <li><a href="#">Technology</a></li>
              <li><a href="#">Entertainment</a></li>
              <li><a href="#">Health</a></li>
              <li><a href="#">World</a></li>
              <li><a href="#">Science</a></li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div className="footer-col">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#">Recent News</a></li>
              <li><a href="#">Trending</a></li>
              <li><a href="#">Topic</a></li>
              <li><a href="#">Live Coverage</a></li>
              <li><a href="#">Videos</a></li>
              <li><a href="#">Photo Gallery</a></li>
            </ul>
          </div>

          {/* Column 4: Company & Contact */}
          <div className="footer-col">
            <h3>Company</h3>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
            <div className="footer-contact">
              <Mail size={16} className="contact-icon" />
              <a href="mailto:news@localnewz.in">news@localnewz.in</a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>
            © 2026 LocalNewz. All rights reserved. Made with <span className="heart">♥</span> in India.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;