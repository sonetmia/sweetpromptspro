import WovenCloth from "@/components/ui/woven-cloth";

export default function WovenClothDemo() {
  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-xl bg-[#16090b]">
      <WovenCloth className="absolute inset-0 h-full w-full" />
    </div>
  );
}
