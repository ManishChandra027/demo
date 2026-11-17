const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-4",
};

const Loader = ({ size = "md", fullPage = false, label = "Loading" }) => {
  const spinner = (
    <span
      role="status"
      aria-label={label}
      className="inline-flex items-center justify-center"
    >
      <span
        aria-hidden="true"
        className={`animate-spin rounded-full border-line border-t-rarewolf-primary ${
          sizes[size] || sizes.md
        }`}
      />
      <span className="sr-only">{label}</span>
    </span>
  );

  if (!fullPage) {
    return spinner;
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-canvas">
      {spinner}
    </div>
  );
};

export default Loader;
