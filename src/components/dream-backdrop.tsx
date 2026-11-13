import heroSky from "@/assets/hero-sky.jpg";
import butterflyImg from "@/assets/butterfly.png";

export function DreamBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <img
        src={heroSky}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-70 mix-blend-lighten"
      />
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,oklch(1_0_0/0.5),transparent_70%)]" />
      <img
        src={butterflyImg}
        alt=""
        className="absolute left-[8%] top-[18%] w-16 opacity-70 animate-butterfly"
        style={{ animationDelay: "0s" }}
      />
      <img
        src={butterflyImg}
        alt=""
        className="absolute right-[12%] top-[40%] w-10 opacity-60 animate-butterfly"
        style={{ animationDelay: "-4s" }}
      />
      <img
        src={butterflyImg}
        alt=""
        className="absolute left-[45%] bottom-[10%] w-8 opacity-50 animate-butterfly"
        style={{ animationDelay: "-8s" }}
      />
      {/* sparkles */}
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="absolute block h-1.5 w-1.5 rounded-full bg-white/80 animate-sparkle"
          style={{
            left: `${(i * 73) % 100}%`,
            top: `${(i * 41) % 100}%`,
            animationDelay: `${(i % 5) * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}
