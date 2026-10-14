import Hero from '@/components/sections/Hero';
import SelectedWork from '@/components/sections/SelectedWork';
import TrustStrip from '@/components/sections/TrustStrip';
import StackStrip from '@/components/sections/StackStrip';
import { approvedLogos, MIN_LOGOS_FOR_MARQUEE } from '@/data/logos';
import Capabilities from '@/components/sections/Capabilities';
import Process from '@/components/sections/Process';
import Conversation from '@/components/sections/Conversation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const hasClientLogos = approvedLogos.length >= MIN_LOGOS_FOR_MARQUEE;

export default function Home() {
  return (
    <>
      <Header />
      <main id="main" className="relative">
        <Hero />
        {/* One logo strip on the page at a time: client logos take the slot
            under the hero once enough are approved; the stack strip then
            moves into Capabilities. */}
        {hasClientLogos ? <TrustStrip /> : <StackStrip />}
        <SelectedWork />
        <Capabilities showStack={hasClientLogos} />
        <Process />
        <Conversation />
      </main>
      <Footer />
    </>
  );
}
