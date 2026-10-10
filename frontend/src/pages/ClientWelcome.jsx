import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientService } from "@/services/client.service";
import { toAppError } from "@/lib/errors";
import { toast } from "sonner";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import StageHeader from "@/features/client/onboarding/StageHeader";
import StructureChooser from "@/features/client/onboarding/StructureChooser";
import Stage1AboutYou from "@/features/client/onboarding/Stage1AboutYou";
import SkipButton from "@/features/client/onboarding/SkipButton";

export default function ClientWelcome() {
  useDocumentTitle("Welcome | Borrowed Blues");
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [choosingStructure, setChoosingStructure] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    return clientService.onboarding()
      .then(setData)
      .catch((e) => toast.error(toAppError(e).message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const saveProfile = async (payload) => {
    const updated = await clientService.updateOnboarding(payload);
    setData((d) => ({ ...d, profile: updated }));
    return updated;
  };

  const chooseStructure = async (mode) => {
    setChoosingStructure(true);
    try {
      if (mode === "call") {
        await saveProfile({ structure_mode: "call", stage1_status: "deferred_to_call" });
      } else {
        await saveProfile({ structure_mode: mode });
      }
    } catch (err) {
      toast.error(toAppError(err).message);
    } finally {
      setChoosingStructure(false);
    }
  };

  const goToDashboard = () => navigate("/portal");

  if (loading) {
    return <p className="text-bb-forest/60">Loading…</p>;
  }

  const structureMode = data?.profile?.structure_mode;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <StageHeader stageNumber={1} totalStages={3} name="About you" minutes={3} />
        <SkipButton onClick={goToDashboard} />
      </div>
      <p className="mt-4 text-bb-forest/70 max-w-md">
        A few basics so Anushka knows how to address you and when to meet. Skip anything you'd rather not share.
      </p>

      {!structureMode ? (
        <StructureChooser onChoose={chooseStructure} busy={choosingStructure} />
      ) : (
        <Stage1AboutYou
          profile={data.profile}
          structureMode={structureMode}
          onSave={saveProfile}
          onContinue={goToDashboard}
          onSkipAll={goToDashboard}
        />
      )}
    </div>
  );
}
