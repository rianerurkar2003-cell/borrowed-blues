import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ReachOutForm from "@/components/ReachOutForm";
import consultationIllustration from "@/assets/consultation-illustration.png";
import { REACH_OUT } from "@/constants/testIds";

/**
 * A gentle public consultation-request modal. Renders any `children` as the
 * trigger button. Pure dialog chrome -- the form itself lives in
 * ReachOutForm, shared with the standalone /reach-out page.
 *
 * Usage:
 *   <ConsultationDialog>
 *     <button className="…">Book a consultation</button>
 *   </ConsultationDialog>
 */
export default function ConsultationDialog({ children, defaultReason = "" }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        data-testid={REACH_OUT.dialog}
        className="max-w-3xl bg-bb-cream border border-bb-moss/70 rounded-3xl p-0 overflow-hidden"
      >
        {/* Radix requires a DialogTitle inside DialogContent for
            accessibility; ReachOutForm renders its own visible heading
            (needed standalone on /reach-out too), so this one stays
            screen-reader-only to avoid a duplicate visible title. */}
        <DialogTitle className="sr-only">Book a consultation</DialogTitle>
        <div className="grid md:grid-cols-[325px_1fr]">
          <aside className="hidden md:flex flex-col bg-bb-moss/50 p-6">
            <p className="bb-eyebrow">A quiet first step</p>
            <p className="mt-3 font-serif text-xl text-bb-forest leading-snug">
              Send a short note. A reply comes personally.
            </p>
            <img
              src={consultationIllustration}
              alt=""
              className="mt-6 w-[277px] h-[534px] object-contain"
            />
          </aside>

          <div className="p-6 md:p-8">
            <ReachOutForm
              key={open}
              defaultReason={defaultReason}
              onCancel={() => setOpen(false)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
