import { Navbar } from "@/components/sections/navbar";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Projects } from "@/components/sections/projects";
import { Skills } from "@/components/sections/skills";
import { Hobbies } from "@/components/sections/hobbies";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import { TennisBall } from "@/components/ui/tennis-ball";

export default function Home() {
  return (
    <>
      <div className="atmosphere" aria-hidden />
      <a href="#about" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-bg">
        Aller au contenu
      </a>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Projects />
        <Skills />
        <Hobbies />
        <Contact />
      </main>
      <Footer />
      <TennisBall />
    </>
  );
}
