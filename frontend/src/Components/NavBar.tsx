import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

export const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <NAV scrolled={scrolled}>
      <div className="nav-inner">
        <Link to="/" className="brand">
          <div className="brand-icon">G</div>
          <span className="brand-name">CodeGenius</span>
        </Link>

        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
          <Link to="/interviews" className={`nav-link ${isActive('/interviews') ? 'active' : ''}`}>Interviews</Link>
          <Link to="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`}>About</Link>
          <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`}>Contact</Link>
        </div>

        <Link to="/interviews" className="nav-cta">
          Start Interview →
        </Link>
      </div>
    </NAV>
  );
};

const NAV = styled.nav<{ scrolled: boolean }>`
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  background: ${({ scrolled }) =>
    scrolled ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.8)'};
  backdrop-filter: blur(12px);
  border-bottom: 1px solid ${({ scrolled }) => scrolled ? '#334155' : 'transparent'};
  transition: all 0.3s ease;

  .nav-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }

  .brand-icon {
    width: 34px;
    height: 34px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 16px;
    color: white;
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
  }

  .brand-name {
    font-size: 18px;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: -0.3px;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .nav-link {
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #94a3b8;
    text-decoration: none;
    transition: all 0.2s;

    &:hover {
      color: #f1f5f9;
      background: #1e293b;
    }

    &.active {
      color: #f1f5f9;
      background: #1e293b;
    }
  }

  .nav-cta {
    padding: 8px 18px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    font-size: 14px;
    font-weight: 600;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.2s;
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 0 28px rgba(99, 102, 241, 0.5);
    }
  }

  @media (max-width: 768px) {
    .nav-links { display: none; }
    .nav-cta { display: none; }
  }
`;
