import React from "react";

const FormRow = ({ label, children, error }) => {
  return (
    <div className="flex flex-col gap-3">
      <label
        className="font-bold text-sm text-gray-300"
        htmlFor={children?.props?.id}
      >
        {label}
      </label>
      {children}
      {error && (
        <span className="text-[0.7rem] text-red-400  rounded-2xl font-bold">
          {error}
        </span>
      )}
    </div>
  );
};

export default FormRow;
