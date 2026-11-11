import { AboutSection } from "@/components/AboutSection";
import { BottomCtaSection } from "@/components/BottomCtaSection";
import { CoasterSection } from "@/components/CoasterSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { Navbar } from "@/components/Navbar";
import { Preloader } from "@/components/Preloader";
import { ProcessSection } from "@/components/ProcessSection";
import { ProjectsSection } from "@/components/ProjectsSection";
import { ScrollReveals } from "@/components/ScrollReveals";
import { SelectedWorkSection } from "@/components/SelectedWorkSection";
import { SkillsSection } from "@/components/SkillsSection";
import { ToTopButton } from "@/components/ToTopButton";
import { WaveDivider } from "@/components/WaveDivider";

export default function HomePage() {
  return (
    <>
      <Preloader />
      <Navbar />
      <main>
        <div id="portfolio">
          <HeroSection />
          <WaveDivider
            id="ly-floor"
            topColor="var(--paper)"
            bottomColor="var(--shell)"
          />
          <SelectedWorkSection />
          <ProcessSection />
        </div>
        <div id="about">
          <AboutSection />
          <SkillsSection />
          <CoasterSection />
        </div>
        <ProjectsSection />
        <ContactSection />
        <BottomCtaSection />
      </main>
      <WaveDivider
        id="foot-wave"
        topColor="var(--paper)"
        bottomColor="var(--shell)"
      />
      <Footer />
      <ToTopButton />
      <ScrollReveals />
    </>
  );
}
