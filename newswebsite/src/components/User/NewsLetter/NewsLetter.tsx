import React from "react";
import { Mail } from "lucide-react";
import "./NewsLetter.css";

const Newsletter: React.FC = () => {
  return (
    <section className="newsletter-section">
      <div className="newsletter-box">
        
        {/* Icon */}
        <div className="newsletter-icon-wrapper">
          <Mail size={28} className="newsletter-icon" strokeWidth={2} />
        </div>

        {/* Text Content */}
        <h2 className="newsletter-title">Stay Informed</h2>
        <p className="newsletter-desc">
          Get the top stories delivered to your inbox every morning. No spam,<br />
          unsubscribe anytime.
        </p>

        {/* Input Form */}
        <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
          <input 
            type="email" 
            placeholder="Enter your email" 
            className="newsletter-input" 
            required
          />
          <button type="submit" className="newsletter-submit-btn">
            Subscribe
          </button>
        </form>

      </div>
    </section>
  );
};

export default Newsletter;