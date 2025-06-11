import React from 'react';

interface Options {
    value: string;
    label: string;
}

interface DropdownProps {
    label: string;
    id?: string;
    value: string;
    onChange: (value: string) => void; // what does this mean
    options: Options[];
    className?: string;
    disabled?: boolean;
}

export default function Dropdown({
    label, id = 'dropdown', value, onChange, options, className = '' }: DropdownProps) {
    return (
        <div className="flex justify-center items-center gap-3">
            <label htmlFor={id} className="text-black mb-2 ">{label}</label>
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)} // e.target is the selected dom element .value gives value of selected option
                className={`bg-white text-black rounded-full px-4 py-1.5 mb-2 ${className}`}
            >
                {options.map((option) => (
                    /**
                     * key: for react to track elements, must be unique among siblings
                     * value: actual data submitted (what e.target.value captures) 
                     */
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    )
}