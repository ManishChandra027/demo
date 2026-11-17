import Loader from "./Loader";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rarewolf-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary:
    "bg-rarewolf-primary text-white hover:bg-rarewolf-primary-hover active:bg-rarewolf-primary-dark",
  secondary:
    "border border-rarewolf-primary bg-white text-rarewolf-primary hover:bg-rarewolf-primary-light",
  ghost: "bg-transparent text-rarewolf-primary hover:bg-rarewolf-primary-light",
  danger: "bg-danger text-white hover:bg-rarewolf-primary-dark",
};

const sizes = {
  icon: "h-8 w-8 p-0",
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  type = "button",
  onClick,
  className = "",
  children,
  ...rest
}) => {
  const buttonVariant = variants[variant] || variants.primary;
  const buttonSize = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${buttonVariant} ${buttonSize} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...rest}
    >
      {loading && <Loader size="sm" label="Please wait" />}
      {children}
    </button>
  );
};

export default Button;
