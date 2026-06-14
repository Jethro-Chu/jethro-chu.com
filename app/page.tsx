import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { BackgroundGradient } from "@/components/scenery/BackgroundGradient";
import { LightSweep } from "@/components/motion/LightSweep";
import { Scenery } from "@/components/scenery/Scenery";
import { Altimeter } from "@/components/Altimeter";
import { AltimeterMarker } from "@/components/AltimeterMarker";
import { Hero } from "@/components/Hero";
import { Approach } from "@/components/Approach";
import { Projects } from "@/components/Projects";
import { About } from "@/components/About";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="relative">
      {/* the climb's light: a page-tall wash (static) + a scroll-linked alpenglow */}
      <BackgroundGradient />
      <LightSweep />
      <Scenery />

      {/* native smooth scroll, never hijacked */}
      <SmoothScroll />

      {/* the signature: static nav rail + the live climbing marker */}
      <Altimeter />
      <AltimeterMarker />

      <main id="main">
        <Hero />
        <Approach />
        <Projects />
        <About />
      </main>
      <Footer />
    </div>
  );
}
