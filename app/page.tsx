import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { ConsoleEgg } from "@/components/motion/ConsoleEgg";
import { BackgroundGradient } from "@/components/scenery/BackgroundGradient";
import { LightSweep } from "@/components/motion/LightSweep";
import { YosemiteScene } from "@/components/scenery/YosemiteScene";
import { RouteLine } from "@/components/scenery/RouteLine";
import { Altimeter } from "@/components/Altimeter";
import { AltimeterMarker } from "@/components/AltimeterMarker";
import { Hero } from "@/components/Hero";
import { Approach } from "@/components/Approach";
import { Projects } from "@/components/Projects";
import { About } from "@/components/About";
import { Footer } from "@/components/Footer";
import { AskJethroProvider } from "@/components/ask-jethro/AskJethro";
import { FloatingAsk } from "@/components/ask-jethro/triggers";
import { CurrentlyBuilding } from "@/components/CurrentlyBuilding";
import { CaseStudyExplorer } from "@/components/CaseStudyExplorer";
import { Method } from "@/components/Method";

export default function Home() {
  return (
    <AskJethroProvider>
    <div className="relative">
      {/* the climb's light: a page-tall wash (static) + a scroll-linked alpenglow */}
      <BackgroundGradient />
      <LightSweep />
      {/* the climb itself: a composed, layered Half Dome atmosphere that the scroll
          pushes through, then dissolves into the sand wash before the projects */}
      <YosemiteScene />
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
        <CurrentlyBuilding />
        <CaseStudyExplorer />
        <Method />
        <About />
      </main>
      <Footer />
      <FloatingAsk />
    </div>
    </AskJethroProvider>
  );
}
