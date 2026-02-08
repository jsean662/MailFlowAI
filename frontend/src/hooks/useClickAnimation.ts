import { useState, useCallback } from 'react';

export const useClickAnimation = (onClick?: (e?: any) => void, duration = 150) => {
    const [isPressed, setIsPressed] = useState(false);

    const trigger = useCallback((e?: any) => {
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), duration);
        if (onClick) {
            onClick(e);
        }
    }, [onClick, duration]);

    return { isPressed, trigger };
};
