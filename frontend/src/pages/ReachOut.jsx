import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { WatercolorPair } from "@/components/Watercolor";
import ReachOutForm from "@/components/ReachOutForm";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function ReachOut() {
  useDocumentTitle("Reach Out | Borrowed Blues");
  return (
    <section className="py-16 md:py-24">
      <div className="bb-container">
        <p className="bb-eyebrow">A quiet first step</p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl text-bb-forest">
          Reach <span className="bb-italic-serif">out.</span>
        </h1>
        <p className="mt-4 text-bb-forest/70 max-w-xl">
          Send a short note. A reply comes personally — no policy to read
          first, no form to get right.
        </p>

        <div className="mt-12 grid md:grid-cols-[1fr_340px] gap-10 md:gap-14 items-start">
          <div data-testid="reach-out-form-card" className="bg-bb-warm rounded-3xl p-6 md:p-8 shadow-soft">
            <ReachOutForm />
          </div>

          <div className="md:sticky md:top-28">
            <Accordion type="single" collapsible defaultValue="before-you-reach-out" data-testid="reach-out-summary">
              <AccordionItem value="before-you-reach-out" className="border-none">
                <div className="bg-bb-mist rounded-3xl p-6">
                  <AccordionTrigger className="py-0 text-left text-bb-forest font-serif text-lg hover:no-underline">
                    Before you reach out
                  </AccordionTrigger>
                  <AccordionContent className="mt-3 text-sm text-bb-forest/80 leading-relaxed pr-2">
                    {/* TODO(confirm): real fees/session-length/cancellation-window copy, owned by Anushka */}
                    <p>Sessions are 50 minutes, held online.</p>
                    <p className="mt-2">Fees and the cancellation window will be shared when you connect.</p>
                    <p className="mt-4">
                      <Link to="/#faq" className="underline hover:text-bb-forest">
                        More questions? See the FAQ
                      </Link>
                    </p>
                  </AccordionContent>
                </div>
              </AccordionItem>
            </Accordion>

            <div className="hidden md:flex justify-center mt-8 opacity-80">
              <div className="w-40 h-40">
                <WatercolorPair className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
