import React, { FC } from 'react';

interface DateTimeDisplayProps {
  value: string;
  type: string;
  isDanger: boolean;
}

const DateTimeDisplay: FC<DateTimeDisplayProps> = ({ value, type, isDanger }) => {
  const formattedValue = value.padStart(2, '0');
  return (
    <div className={  isDanger ? 'color-[#ff0000] flex' : 'py-2 flex  items-center'}>
      <p className='mx-1'>{formattedValue}</p>
      <span className='text-md mr-1'>{type}</span>
    </div>
  );
};

export default DateTimeDisplay;
