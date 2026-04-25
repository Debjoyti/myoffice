import { useState, useEffect, useRef } from 'react';

const useActivityMonitor = (timeoutSeconds = 600) => {
  const [idleTime, setIdleTime] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const idleTimeRef = useRef(0);

  useEffect(() => {
    let intervalId;

    const resetIdleTime = () => {
      idleTimeRef.current = 0;
      setIdleTime(0);
      setIsActive(true);
    };

    const handleActivity = () => {
      if (!isActive) {
        setIsActive(true);
      }
      idleTimeRef.current = 0;
      setIdleTime(0);
    };

    // Attach event listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    // Timer to increment idle time
    intervalId = setInterval(() => {
      idleTimeRef.current += 1;
      setIdleTime(idleTimeRef.current);

      if (idleTimeRef.current >= timeoutSeconds) {
        setIsActive(false);
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearInterval(intervalId);
    };
  }, [isActive, timeoutSeconds]);

  return { idleTime, isActive };
};

export default useActivityMonitor;
