import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
 return (
  <Sonner
   position="bottom-right"
   duration={4000}
   visibleToasts={1}
   className="toaster group"
   toastOptions={{
    classNames: {
     toast:
      "group toast group-[.toaster]:bg-background group-[.toaster]:text-primary group-[.toaster]:border-divider z-[var(--z-toast)]",
     description: "group-[.toast]:text-secondary",
     actionButton: "group-[.toast]:bg-primary group-[.toast]:text-white",
     cancelButton: "group-[.toast]:bg-card group-[.toast]:text-secondary",
    },
   }}
   {...props}
  />
 );
};

export { Toaster };
