import Hero from '@/components/sections/Hero';
import SelectedWork from '@/components/sections/SelectedWork';
import LogoWall from '@/components/sections/LogoWall';
import Capabilities from '@/components/sections/Capabilities';
import Process from '@/components/sections/Process';
import Conversation from '@/components/sections/Conversation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <main className="relative">
        <Hero />
        <SelectedWork />
        <LogoWall />
        <Capabilities />
        <Process />
        <Conversation />
      </main>
      <Footer />
    </>
  );
}
