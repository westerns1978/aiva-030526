import React from 'react';

// Using colors inspired by the South African flag for thematic consistency

export const EnglishFlag: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="50" fill="#002395" />
    <text x="50" y="50" dy=".3em" textAnchor="middle" fill="white" fontSize="40" fontWeight="bold" fontFamily="sans-serif">EN</text>
  </svg>
);

export const AfrikaansFlag: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="50" fill="#de3831" />
    <text x="50" y="50" dy=".3em" textAnchor="middle" fill="white" fontSize="40" fontWeight="bold" fontFamily="sans-serif">AF</text>
  </svg>
);

export const XhosaFlag: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="50" fill="#007a4d" />
    <text x="50" y="50" dy=".3em" textAnchor="middle" fill="white" fontSize="40" fontWeight="bold" fontFamily="sans-serif">XH</text>
  </svg>
);

export const ZuluFlag: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="50" fill="#ffb612" />
    <text x="50" y="50" dy=".3em" textAnchor="middle" fill="#000000" fontSize="40" fontWeight="bold" fontFamily="sans-serif">ZU</text>
  </svg>
);

export const SothoFlag: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="50" fill="#000000" />
    <text x="50" y="50" dy=".3em" textAnchor="middle" fill="white" fontSize="40" fontWeight="bold" fontFamily="sans-serif">ST</text>
  </svg>
);