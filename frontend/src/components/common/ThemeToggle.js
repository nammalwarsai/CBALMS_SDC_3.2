import React, { useContext } from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ThemeContext } from '../../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
    const { theme, toggleTheme } = useContext(ThemeContext);

    const isDark = theme === 'dark';

    return (
        <OverlayTrigger
            placement="bottom"
            overlay={<Tooltip>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</Tooltip>}
        >
            <Button
                variant={isDark ? "outline-light" : "outline-dark"}
                onClick={toggleTheme}
                className={`d-flex align-items-center justify-content-center ${className}`}
                aria-label="Toggle Dark Mode"
                style={{ width: '42px', height: '42px', borderRadius: '50%' }}
            >
                {isDark ? (
                    <i className="bi bi-sun-fill text-warning"></i>
                ) : (
                    <i className="bi bi-moon-stars-fill"></i>
                )}
            </Button>
        </OverlayTrigger>
    );
};

export default ThemeToggle;
