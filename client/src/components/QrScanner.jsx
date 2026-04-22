import { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function QrScanner({ onScan }) {
  const [error, setError] = useState("");
  const [facingMode, setFacingMode] = useState("environment"); // environment = back cam, user = front cam
  const [lastErrName, setLastErrName] = useState("");
  const [running, setRunning] = useState(false);
  const regionId = useMemo(() => `qr-region-${Math.random().toString(16).slice(2)}`, []);
  const qrRef = useRef(null);
  const scanningRef = useRef(false);
  const startedRef = useRef(false);

  // html5-qrcode expects facingMode as a string ("user" | "environment"),
  // not nested constraints (e.g. { ideal: ... }).
  const constraints = useMemo(() => ({ facingMode }), [facingMode]);

  function explainError(err) {
    const name = err?.name || err?.toString?.() || "UnknownError";
    setLastErrName(name);

    if (name === "NotAllowedError") return "Camera permission denied. Allow camera for this site.";
    if (name === "NotFoundError") return "No camera found on this device.";
    if (name === "NotReadableError")
      return "Camera is in use by another app (Zoom/Teams/Camera). Close it and retry.";
    if (name === "OverconstrainedError")
      return "Selected camera constraints are not supported. Try switching Front/Back.";

    return `Camera error: ${name}`;
  }

  useEffect(() => {
    setError("");
    setLastErrName("");
    scanningRef.current = false;
    startedRef.current = false;

    const qr = new Html5Qrcode(regionId, { verbose: false });
    qrRef.current = qr;

    const config = {
      fps: 10,
      qrbox: { width: 280, height: 280 },
      aspectRatio: 1.0,
      disableFlip: false,
    };

    (async () => {
      try {
        await qr.start(
          constraints,
          config,
          (decodedText) => {
            // Prevent repeated spam reads
            if (scanningRef.current) return;
            scanningRef.current = true;
            onScan(decodedText);
            setTimeout(() => {
              scanningRef.current = false;
            }, 1200);
          },
          () => {}
        );
        startedRef.current = true;
        setRunning(true);
      } catch (e) {
        setRunning(false);
        setError(explainError(e));
      }
    })();

    return () => {
      setRunning(false);
      scanningRef.current = false;
      const instance = qrRef.current;
      qrRef.current = null;

      if (!instance) return;

      // html5-qrcode throws if stop() is called before it actually starts.
      const stopIfStarted = startedRef.current ? instance.stop().catch(() => {}) : Promise.resolve();

      stopIfStarted.finally(() => {
        try {
          instance.clear();
        } catch (e) {
          // ignore
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionId, facingMode]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-900">QR Scanner</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setError("");
              setFacingMode("user");
            }}
            className={[
              "rounded-md border px-3 py-1.5 text-xs hover:bg-slate-50",
              facingMode === "user" ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white",
            ].join(" ")}
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => {
              setError("");
              setFacingMode("environment");
            }}
            className={[
              "rounded-md border px-3 py-1.5 text-xs hover:bg-slate-50",
              facingMode === "environment"
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-white",
            ].join(" ")}
          >
            Back
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-black">
        <div id={regionId} className="w-full" />
      </div>
      {error ? (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
          {lastErrName ? <div className="mt-1 text-xs text-red-700/80">({lastErrName})</div> : null}
        </div>
      ) : (
        <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
          {running ? (
            <>
              Camera started. Point it at the admin QR.
            </>
          ) : (
            <>
              Starting camera… If the preview is black, try switching{" "}
              <span className="font-medium">Front/Back</span>.
            </>
          )}
        </div>
      )}
      <p className="text-xs text-slate-500">
        Tip: if it still stays black, close Windows Camera/Teams/Zoom and refresh the page.
      </p>
    </div>
  );
}

