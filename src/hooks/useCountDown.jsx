import React, { useEffect, useState } from 'react';



const useCountdown = (targetDate) => {
  const countDownDate = new Date(targetDate).getTime();
  
  const [countDown, setCountDown] = useState(
    countDownDate - new Date().getTime()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCountDown(countDownDate - new Date().getTime());
      console.log('firstuseEffec',{countDownDate},countDownDate - new Date().getTime())
    }, 1000);

    return () => clearInterval(interval);
  }, [countDownDate]);

  return getReturnValues(countDown);
};

const getReturnValues = (countDown) => {
  console.log('firstcoun',countDown)
  // Calculate time left
  const days = Math.round(countDown / (1000 * 60 * 60 * 24));
  const hours = Math.round(
    (countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.round((countDown % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.round((countDown % (1000 * 60)) / 1000);
console.log("firstaal",{days,minutes,hours,seconds})
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
}
export { useCountdown };
