import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';

/**
 * Floating "Back to Top" button that appears after scrolling down (UI-08)
 */
const BackToTop = ({ threshold = 300 }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > threshold);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <Button
      variant="primary"
      onClick={scrollToTop}
      aria-label="Back to top"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 1050,
        borderRadius: '50%',
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        padding: 0
      }}
    >
      <i className="bi bi-arrow-up" style={{ fontSize: '1.3rem' }}></i>
    </Button>
  );
};

export default BackToTop;
