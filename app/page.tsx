import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { Archive } from "@/components/sections/Archive";
import { About } from "@/components/sections/About";
import { Skills } from "@/components/sections/Skills";
import { Focus } from "@/components/sections/Focus";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <FeaturedWork />
      <Archive />
      <About />
      <Skills />
      <Focus />
      <Contact />
    </>
  );
}
