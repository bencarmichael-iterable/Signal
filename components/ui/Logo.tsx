import Link from "next/link";
import Image from "next/image";

type LogoProps = {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-6 w-auto",
  md: "h-8 w-auto",
  lg: "h-12 w-auto",
};

export function Logo({ href = "/", className = "", size = "md" }: LogoProps) {
  const img = (
    <Image
      src="/signal-v2-logo-teal-accent.svg"
      alt="Signal"
      width={160}
      height={40}
      className={`${sizeClasses[size]} ${className}`}
      priority
    />
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {img}
      </Link>
    );
  }

  return img;
}
