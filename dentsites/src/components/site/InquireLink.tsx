import Link from "next/link";
import { Arrow, buttonClass, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { siteConfig } from "@/config/site";

interface Props {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  arrow?: boolean;
  /** Defaults to the short "Inquire"; pass the long label where there is room. */
  children?: React.ReactNode;
}

/** The clinic-owner call to action. Renders nothing on a real clinic's site. */
export function InquireLink({ variant = "inquire", size = "md", className = "", arrow = false, children }: Props) {
  if (!siteConfig.demo) return null;
  return (
    <Link href={siteConfig.inquiry.path} className={buttonClass(variant, size, className)} data-inquire>
      {children ?? siteConfig.inquiry.ctaLabel}
      {arrow && <Arrow />}
    </Link>
  );
}
