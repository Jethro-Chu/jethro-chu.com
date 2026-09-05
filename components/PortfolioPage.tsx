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
import { EyeScrollProvider } from "@/components/eye-scroll/EyeScroll";
import { FloatingAsk } from "@/components/ask-jethro/triggers";
import { CurrentlyBuilding } from "@/components/CurrentlyBuilding";
import { CaseStudyExplorer } from "@/components/CaseStudyExplorer";
import { Method } from "@/components/Method";

export function PortfolioPage() {
  return (
    <AskJethroProvider>
      <EyeScrollProvider>
        <div className="relative">
          <BackgroundGradient />
          <LightSweep />
          <YosemiteScene />
          <RouteLine />

          <SmoothScroll />
          <ConsoleEgg />

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
      </EyeScrollProvider>
    </AskJethroProvider>
  );
}
