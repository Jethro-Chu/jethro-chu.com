import { Hero } from "@/components/sections/Hero";
import { WorkShowcase } from "@/components/sections/WorkShowcase";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Hero />
      <WorkShowcase />
      <About />
      <Contact />
    </>
  );
}
