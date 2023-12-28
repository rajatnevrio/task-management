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
    <div className="text-center p-1  rounded-md   ">
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
      {days + hours + minutes + seconds > 0 ? (
        <span className="flex justify-center items-center font-bold text-base p-1  rounded-md text-black">
          {days > 0 && (
            <>
              <DateTimeDisplay
                value={days.toString()}
                dateType={'days'}
                type={""}
                isDanger={days <= 3}
              />
              <p>:</p>
            </>
          )}
          {hours > 0 && (
            <>
              <DateTimeDisplay
                value={hours.toString()}
                dateType={'hours'}
                type={""}
                isDanger={hours <= 3}
              />
              <p> : </p>
            </>
          )}
          {minutes > 0 && (
            <>
              <DateTimeDisplay
                value={minutes.toString()}
                dateType={'minutes'}
                type={""}
                isDanger={minutes <= 3}
              />
              <p> : </p>
            </>
          )}
          <DateTimeDisplay
            value={seconds.toString()}
            dateType={'seconds'}
            type={"left"}
            isDanger={false}
          />
        </span>
      ) : (
        // Display elapsed time
        <span className="flex justify-center items-center font-bold text-base p-1  rounded-md text-red-500">
      { Math.abs(days) >0 && (
            <>
              <DateTimeDisplay
                value={Math.abs(days).toString()}
                dateType={'days'}
                type={""}
                isDanger={days <= 3}
              />
              <p>:</p>
            </>
          )}
          { Math.abs(hours) >0 && (
            <>
              <DateTimeDisplay
                value={Math.abs(hours).toString()}
                dateType={'hours'}
                type={""}
                isDanger={hours <= 3}
              />
              <p> : </p>
            </>
          )}
          {Math.abs(minutes) >0 && (
            <>
              <DateTimeDisplay
                value={Math.abs(minutes).toString()}
                dateType={'minutes'}
                type={""}
                isDanger={minutes <= 3}
              />
              <p> : </p>
            </>
          )}
          <DateTimeDisplay
            value={Math.abs(seconds).toString()}
            dateType={'seconds'}
            type={"delay"}
            isDanger={false}
          />
        </span>
      )}
    </div>
  );
};


interface CountdownTimerProps {
  targetDate: Date;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const { days, hours, minutes, seconds } = useCountdown(targetDate);
  // if (days + hours + minutes + seconds <= 0) {
  //   return <ExpiredNotice />;
  // } else {
    return (
      <ShowCounter
        days={days}
        hours={hours}
        minutes={minutes}
        seconds={seconds}
      />
    );
  // }
};

export default CountdownTimer;
