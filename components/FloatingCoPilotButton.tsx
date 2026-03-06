
import React from 'react';

interface FloatingCoPilotButtonProps {
    onClick: () => void;
}

export const FloatingCoPilotButton: React.FC<FloatingCoPilotButtonProps> = ({ onClick }) => {
    // Return null since we now have a permanent button in the EmployeePortal header
    return null;
};
