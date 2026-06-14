import { Altimeter } from "@/components/Altimeter";
import { Hero } from "@/components/Hero";
import { Approach } from "@/components/Approach";
import { Projects } from "@/components/Projects";
import { About } from "@/components/About";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Altimeter />
      <main id="main">
        <Hero />
        <Approach />
        <Projects />
        <About />
      </main>
      <Footer />
    </>
  );
}
