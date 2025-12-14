import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>GoShopperAI</h1>
        <p>Smart Receipt Scanning & Expense Tracking</p>
      </header>
      <main>
        <section id="about">
          <h2>About the App</h2>
          <p>GoShopperAI uses advanced AI to scan receipts and track your expenses effortlessly. Simply take a photo of your receipt, and our app extracts all the details automatically.</p>
        </section>
        <section id="features">
          <h2>Key Features</h2>
          <ul>
            <li>AI-powered receipt scanning</li>
            <li>Automatic expense categorization</li>
            <li>Offline support</li>
            <li>Multi-photo scanning</li>
            <li>Secure cloud storage</li>
          </ul>
        </section>
        <section id="download">
          <h2>Download Now</h2>
          <a href="#" className="download-btn">Download for Android</a>
          <a href="#" className="download-btn">Download for iOS</a>
        </section>
        <nav>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms & Conditions</a>
          <a href="#support">Support</a>
        </nav>
        <section id="privacy">
          <h2>Privacy Policy</h2>
          <p>Your privacy is important to us. We collect minimal data necessary for the app to function...</p>
        </section>
        <section id="terms">
          <h2>Terms & Conditions</h2>
          <p>By using GoShopperAI, you agree to these terms...</p>
        </section>
        <section id="support">
          <h2>Support</h2>
          <p>Contact us at support@goshopperai.com for help.</p>
        </section>
      </main>
      <footer>
        <p>&copy; 2025 GoShopperAI. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;