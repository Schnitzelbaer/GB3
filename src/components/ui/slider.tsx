import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

function Slider({
  className,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-zh-blue" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block size-3.5 rounded-full border border-zh-blue bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    </SliderPrimitive.Root>
  );
}

export { Slider };
