import React, { useEffect, useState } from 'react';



const useCountdown = (targetDate) => {
  const countDownDate = new Date(targetDate).getTime();
  
  const [countDown, setCountDown] = useState(
    countDownDate - new Date().getTime()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCountDown(countDownDate - new Date().getTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [countDownDate]);

  return getReturnValues(countDown);
};

const getReturnValues = (countDown) => {
  // Calculate time left
  const days = Math.floor(Math.abs(countDown) / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (Math.abs(countDown) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((Math.abs(countDown) % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((Math.abs(countDown) % (1000 * 60)) / 1000);

  // Calculate elapsed time (using absolute values)
  const absoluteDays = Math.abs(days);
  const absoluteHours = Math.abs(hours);
  const absoluteMinutes = Math.abs(minutes);
  const absoluteSeconds = Math.abs(seconds);


  return {
    days: countDown < 0 ? -absoluteDays : absoluteDays,
    hours: countDown < 0 ? -absoluteHours : absoluteHours,
    minutes: countDown < 0 ? -absoluteMinutes : absoluteMinutes,
    seconds: countDown < 0 ? -absoluteSeconds : absoluteSeconds,
  };
};
export { useCountdown };
