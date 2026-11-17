import { Link } from "react-router-dom";
import icon from "/icons.png";
const RareWolfLogo = ({ className = "", asLink = true, light = false }) => {
  const text = (
    <span
      className={`select-none text-2xl font-extrabold tracking-tight ${
        light ? "text-white" : "text-ink"
      } ${className}`}
    >
      <span className={light ? "text-white" : "text-ink"}>Rare</span>
      <span className="text-rarewolf-primary">Wolf</span>
    </span>
  );

  if (!asLink) {
    return text;
  }

  return (
    <Link
      to="/"
      aria-label="RareWolf home"
      className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rarewolf-primary focus-visible:ring-offset-2"
    >
      <img src={icon} alt="RareWolf logo" className="mr-2 h-8 w-8 rounded-md " />
      {text}
    </Link>
  );
};

export default RareWolfLogo;
