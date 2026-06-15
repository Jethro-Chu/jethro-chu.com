import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { ConsoleEgg } from "@/components/motion/ConsoleEgg";
import { BackgroundGradient } from "@/components/scenery/BackgroundGradient";
import { LightSweep } from "@/components/motion/LightSweep";
import { YosemiteBackground } from "@/components/scenery/YosemiteBackground";
import { RouteLine } from "@/components/scenery/RouteLine";
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
      {/* the climb itself: a real-time 3D canyon the camera flies up with the scroll */}
      <YosemiteBackground />
      {/* the climbing route, drawing down the page */}
      <RouteLine />

      {/* native smooth scroll, never hijacked */}
      <SmoothScroll />
      <ConsoleEgg />

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
