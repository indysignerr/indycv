import { Story } from "@/components/story/story";
import { Navbar } from "@/components/sections/navbar";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Projects } from "@/components/sections/projects";
import { Skills } from "@/components/sections/skills";
import { Hobbies } from "@/components/sections/hobbies";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";

/** Version classique (sans WebGL ou reduced-motion) */
function Classic() {
  return (
    <>
      <div className="atmosphere" aria-hidden />
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
    </>
  );
}

export default function Home() {
  return <Story fallback={<Classic />} />;
}
