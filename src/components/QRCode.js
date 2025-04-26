import React, { useEffect, useState } from 'react';

const QRCode = () => {
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    // Get the current URL to display
    setCurrentUrl(window.location.href);
  }, []);

  return (
    <div className="qr-code-container">
      <div className="qr-code-wrapper">
        <h3>Access on your phone</h3>
        <div className="qr-placeholder">
          <div className="qr-pattern"></div>
        </div>
        <p>Open this URL on your phone:</p>
        <div className="url-display">{currentUrl}</div>
      </div>
      <style jsx>{`
        .qr-code-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
          background-color: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          max-width: 280px;
          text-align: center;
        }
        
        .qr-code-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        
        h3 {
          margin: 0;
          font-size: 16px;
          color: #333;
          font-weight: bold;
        }
        
        p {
          margin: 0;
          font-size: 12px;
          color: #666;
        }
        
        .qr-placeholder {
          width: 150px;
          height: 150px;
          background-color: white;
          border: 1px solid #ccc;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .qr-pattern {
          width: 120px;
          height: 120px;
          background-color: #000;
          position: relative;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-template-rows: repeat(7, 1fr);
          gap: 2px;
        }
        
        .qr-pattern::before, .qr-pattern::after {
          content: "";
          position: absolute;
          width: 30px;
          height: 30px;
          background-color: #000;
          border: 5px solid white;
          box-sizing: border-box;
        }
        
        .qr-pattern::before {
          top: 10px;
          left: 10px;
        }
        
        .qr-pattern::after {
          top: 10px;
          right: 10px;
        }
        
        .url-display {
          word-break: break-all;
          font-size: 12px;
          background-color: #f5f5f5;
          padding: 5px;
          border-radius: 4px;
          border: 1px solid #ddd;
          max-width: 100%;
        }
        
        @media (max-width: 768px) {
          .qr-code-container {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default QRCode; 