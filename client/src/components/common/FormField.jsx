const inputBase =
  "h-11 w-full rounded-lg border bg-surface px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-rarewolf-primary focus:ring-2 focus:ring-rarewolf-primary/10 disabled:cursor-not-allowed disabled:opacity-60";

const FormField = ({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  min,
  max,
  step,
  required = false,
  disabled = false,
  error,
  register,
  validation = {},
  value,
  onChange,
  autoFocus = false,
  children,
}) => {
  const fieldProps = register
    ? register(id, validation)
    : value !== undefined
      ? { value, onChange }
      : {};

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          min={min}
          max={max}
          step={step}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputBase} ${children ? "pr-11" : ""} ${
            error ? "border-danger" : "border-line"
          }`}
          {...fieldProps}
        />
        {children}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-danger">
          {error.message}
        </p>
      )}
    </div>
  );
};

export default FormField;
