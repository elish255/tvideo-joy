import { CheckCircle2, Copy, Smartphone } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export const ACTIVATION_FEE = 16000;
export const LIPA_NAMBA = "251161660";
export const BUSINESS_NAME = "ASSERT BRIDGE";

const methods = [
  { name: "Vodacom M-Pesa", ussd: "*150*00#", steps: ["Bonyeza *150*00#", "Chagua Lipa kwa M-PESA", "Chagua Lipa kwa simu / mitandao mingine", `Weka LIPA NAMBA: ${LIPA_NAMBA}`, `Weka kiasi ${ACTIVATION_FEE.toLocaleString()} TZS`, "Weka namba ya siri na thibitisha"] },
  { name: "Mixx by Yas", ussd: "*150*01#", steps: ["Bonyeza *150*01#", "Chagua Lipa kwa simu", "Chagua kwenda mitandao mingine", "Chagua Lipa kwa simu / Halopesa", `Weka LIPA NAMBA: ${LIPA_NAMBA}`, `Weka kiasi ${ACTIVATION_FEE.toLocaleString()} TZS`, "Weka namba ya siri na thibitisha"] },
  { name: "Airtel Money", ussd: "*150*60#", steps: ["Bonyeza *150*60#", "Chagua Lipia Bili", "Chagua LIPA KWA SIMU (MITANDAO YOTE)", "Chagua Halopesa", `Weka kiasi ${ACTIVATION_FEE.toLocaleString()} TZS`, `Weka kumbukumbu / namba ya malipo: ${LIPA_NAMBA}`, "Ingiza namba ya siri na thibitisha"] },
  { name: "Halopesa", ussd: "*150*88#", steps: ["Bonyeza *150*88#", "Chagua (5) Lipia Bidhaa", "Chagua Halopesa", `Weka namba ya malipo: ${LIPA_NAMBA}`, `Weka kiasi ${ACTIVATION_FEE.toLocaleString()} TZS`, "Ingiza namba ya siri na thibitisha"] },
];

export function PaymentInstructions() {
  const [open, setOpen] = useState<string | null>(methods[0].name);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard?.writeText(LIPA_NAMBA);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="rounded-lg border border-card-border bg-card p-4 text-card-foreground shadow-md shadow-card-shadow">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-full bg-accent text-accent-foreground"><Smartphone className="size-5" /></div>
        <div><h2 className="font-display text-xl font-extrabold">Njia za Malipo / USSD Menu</h2><p className="text-sm font-semibold text-card-muted">Activation fee: {ACTIVATION_FEE.toLocaleString()} TZS</p></div>
      </div>
      <div className="mt-4 rounded-lg border border-accent/30 bg-receipt-bg p-4">
        <p className="text-sm font-bold text-card-muted">LIPA NAMBA</p>
        <div className="mt-1 flex items-center justify-between gap-3"><strong className="font-display text-2xl">{LIPA_NAMBA}</strong><Button type="button" size="compact" variant="card" onClick={copy}><Copy className="size-4" />{copied ? "Copied" : "Copy"}</Button></div>
        <p className="mt-2 text-sm font-semibold">Jina la Biashara: <strong>{BUSINESS_NAME}</strong></p>
      </div>
      <div className="mt-4 space-y-2">
        {methods.map((method) => {
          const isOpen = open === method.name;
          return <div key={method.name} className="overflow-hidden rounded-lg border border-card-border">
            <button type="button" className="flex w-full items-center justify-between px-4 py-3 text-left font-display font-extrabold" onClick={() => setOpen(isOpen ? null : method.name)}>
              <span>{method.name}</span><span className="text-sm text-card-muted">{method.ussd}</span>
            </button>
            {isOpen && <ol className="space-y-2 border-t border-card-border p-4 text-sm font-semibold">
              {method.steps.map((step, index) => <li key={step} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-extrabold">{index + 1}</span><span>{step}</span></li>)}
              <li className="mt-3 flex items-center gap-2 text-success"><CheckCircle2 className="size-5" /> Jina la Biashara: <strong>{BUSINESS_NAME}</strong></li>
            </ol>}
          </div>;
        })}
      </div>
    </section>
  );
}
