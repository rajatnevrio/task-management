import React from "react";
import { useCountdown } from "../../hooks/useCountDown";
import DateTimeDisplay from "./DateTimeDisplay ";

interface ShowCounterProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const ExpiredNotice: React.FC = () => {
  return (
    <div className="text-center p-1 border rounded-md   ">
      <span className="text-xl font-bold text-red-500">Expired!!!</span>
      {/* <p className="text-base">Please select a future date and time.</p> */}
    </div>
  );
};

const ShowCounter: React.FC<ShowCounterProps> = ({
  days,
  hours,
  minutes,
  seconds,
}) => {
  return (
    <div className="p-2 width-[150px]">
      <a
        href="https://tapasadhikary.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex justify-center items-center font-semibold text-base p-1 border rounded-md text-black"
      >
        {days > 0 && (
          <>
            <DateTimeDisplay
              value={days.toString()}
              type={"Days"}
              isDanger={days <= 3}
            />
            <p>:</p>
          </>
        )}
        {hours > 0 && (
          <>
            <DateTimeDisplay
              value={hours.toString()}
              type={"Hours"}
              isDanger={hours <= 3}
            />
            <p>:</p>
          </>
        )}
        {minutes > 0 && (
          <>
            <DateTimeDisplay
              value={minutes.toString()}
              type={"Mins"}
              isDanger={minutes <= 3}
            />
            <p>:</p>
          </>
        )}
        <DateTimeDisplay
          value={seconds.toString()}
          type={"Seconds"}
          isDanger={false}
        />
      </a>
    </div>
  );
};

interface CountdownTimerProps {
  targetDate: Date;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const { days, hours, minutes, seconds } = useCountdown(targetDate);

  if (days + hours + minutes + seconds <= 0) {
    return <ExpiredNotice />;
  } else {
    return (
      <ShowCounter
        days={days}
        hours={hours}
        minutes={minutes}
        seconds={seconds}
      />
    );
  }
};

export default CountdownTimer;
