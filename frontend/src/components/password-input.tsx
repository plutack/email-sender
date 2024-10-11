import * as React from "react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  labelClassName?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, labelClassName, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const disabled = props.disabled || !props.value;

    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setShowPassword(event.target.checked);
    };

    return (
      <div className="space-y-2">
        <input
          type={showPassword ? "text" : "password"}
          className={cn("w-full px-3 py-2 border rounded-md", className)}
          ref={ref}
          {...props}
        />
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="show-password"
            checked={showPassword}
            onChange={handleCheckboxChange}
            disabled={disabled}
          />
          <label
            htmlFor="show-password"
            className={cn(
              "text-sm select-none",
              disabled ? "text-gray-400" : "text-gray-700",
              labelClassName
            )}
          >
            Show password
          </label>
        </div>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };