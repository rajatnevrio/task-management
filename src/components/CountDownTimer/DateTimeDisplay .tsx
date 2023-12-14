import React, { FC } from 'react';

interface DateTimeDisplayProps {
  value: string;
  type: string;
  isDanger: boolean;
}

const DateTimeDisplay: FC<DateTimeDisplayProps> = ({ value, type, isDanger }) => {
  return (
    <div className={  isDanger ? 'color-[#ff0000] flex' : 'py-2 flex  items-center'}>
      <p className='m-0'>{value}</p>
      <span className='text-md'>{type}</span>
    </div>
  );
};

export default DateTimeDisplay;
