import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { clientService } from "@/services/client.service";
import { toAppError } from "@/lib/errors";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ClientResourceDetail() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    clientService.resource(id)
      .then(setResource)
      .catch((e) => { const err = toAppError(e); setError(err.message); toast.error(err.message); })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="max-w-2xl">
      <Link to="/portal/resources" className="inline-flex items-center gap-2 text-sm text-bb-teal hover:underline">
        <ArrowLeft size={15} /> Back to resources
      </Link>
      {loading ? (
        <p className="mt-8 text-bb-forest/60">Loading…</p>
      ) : error ? (
        <p className="mt-8 text-bb-forest/60">Couldn't load this resource.</p>
      ) : (
        <>
          <p className="bb-eyebrow mt-8">{resource.category}</p>
          <h1 className="mt-3 font-serif text-3xl md:text-4xl text-bb-forest">{resource.title}</h1>
          <p className="mt-3 text-bb-forest/70">{resource.description}</p>
          <div className="mt-8 space-y-4 text-bb-forest/80 leading-relaxed whitespace-pre-line">
            {resource.body}
          </div>
        </>
      )}
    </div>
  );
}
