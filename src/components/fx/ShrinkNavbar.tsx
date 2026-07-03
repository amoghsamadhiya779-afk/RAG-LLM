import { Navbar } from "@/components/landing/Navbar";

interface Props {
  onOpenPalette?: () => void;
}

// Kept as a thin wrapper so existing imports continue to work.
// The PillNav-based Navbar handles its own scroll/appearance.
export function ShrinkNavbar(_props: Props) {
  return <Navbar />;
}
