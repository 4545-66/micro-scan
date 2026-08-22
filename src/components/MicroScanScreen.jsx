import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  ScanLine,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Circle,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Zap,
  ZapOff,
  Microscope,
  MoveHorizontal,
  Lock,
} from "lucide-react";

// ── Design tokens ──────────────────────────────────────────────
// Fond quasi-noir type labo/viseur, accent "scan" cyan-vert (evoque loupe/scanner,
// pas le terracotta Claude par défaut), texte technique en mono pour les valeurs.
const T = {
  bg: "#0A0D0C",
  surface: "#141917",
  surfaceLine: "#232B28",
  text: "#E7F3EE",
  textDim: "#7E938B",
  accent: "#4FE0B0",
  accentDim: "#2A6B54",
  warn: "#FFB454",
  danger: "#FF6B4A",
};

const STAGES = {
  ONBOARDING: "onboarding",
  FRAMING: "framing",
  CAPTURED: "captured",
  RESULT: "result",
};

// ── Racine ──────────────────────────────────────────────────────
export default function MicroScanScreen() {
  const [stage, setStage] = useState(STAGES.ONBOARDING);
  const [torchOn, setTorchOn] = useState(false);
  const [zoom, setZoom] = useState(180);
  const [locked, setLocked] = useState(false);
  const [toast, setToast] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const activeVideoRef = useRef(null);

  const showToast = useCallback((message, tone = "info") => {
    setToast({ message, tone, key: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const handleCapture = useCallback(() => {
    setStage(STAGES.CAPTURED);
    showToast("Image capturée, analyse en cours…", "info");

    // Si le flux caméra réel est actif, on fige l'image dans un canvas.
    const video = activeVideoRef.current;
    if (video && video.videoWidth) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      setCapturedImage(canvas.toDataURL("image/jpeg", 0.92));
    } else {
      setCapturedImage(null); // pas de caméra réelle → l'écran résultat retombe sur le rendu simulé
    }

    setTimeout(() => setStage(STAGES.RESULT), 900);
  }, [showToast]);

  const reset = () => {
    setStage(STAGES.FRAMING);
    setLocked(false);
    setCapturedImage(null);
    showToast("Prêt pour une nouvelle capture", "info");
  };

  const finishOnboarding = () => {
    setStage(STAGES.FRAMING);
    showToast("Vise l'échantillon et cale le repère au centre", "info");
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
        background: T.bg,
        color: T.text,
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        minHeight: 780,
        borderRadius: 28,
        overflow: "hidden",
        position: "relative",
        border: `1px solid ${T.surfaceLine}`,
      }}
    >
      {stage === STAGES.ONBOARDING && (
        <Onboarding onDone={finishOnboarding} />
      )}

      {(stage === STAGES.FRAMING || stage === STAGES.CAPTURED) && (
        <CameraScreen
          torchOn={torchOn}
          setTorchOn={setTorchOn}
          zoom={zoom}
          setZoom={setZoom}
          locked={locked}
          setLocked={setLocked}
          stage={stage}
          onCapture={handleCapture}
          showToast={showToast}
          activeVideoRef={activeVideoRef}
        />
      )}

      {stage === STAGES.RESULT && (
        <ResultScreen
          onBack={reset}
          zoom={zoom}
          showToast={showToast}
          capturedImage={capturedImage}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}

// ── Toast de retour utilisateur ─────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  const toneColor = toast.tone === "warn" ? T.warn : T.accent;
  return (
    <div
      key={toast.key}
      style={{
        position: "absolute",
        top: 14,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(20,25,23,0.95)",
        border: `1px solid ${toneColor}`,
        borderRadius: 12,
        padding: "9px 16px",
        fontSize: 12.5,
        color: T.text,
        zIndex: 50,
        maxWidth: "88%",
        textAlign: "center",
        boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
        animation: "toastIn 0.25s ease-out",
      }}
    >
      {toast.message}
    </div>
  );
}

// ── Onboarding animé (3 étapes) ─────────────────────────────────
const ONBOARDING_STEPS = [
  {
    icon: Microscope,
    title: "Clipse la lentille",
    text: "Fixe le clip microscope sur l'objectif de ton téléphone, bien centré sur la caméra.",
  },
  {
    icon: MoveHorizontal,
    title: "Approche l'échantillon",
    text: "Rapproche la lentille jusqu'à ce que l'image devienne nette, à environ 6–7 mm.",
  },
  {
    icon: Lock,
    title: "Cadre et capture",
    text: "Cale le repère au centre, verrouille le cadrage, puis appuie sur le bouton pour capturer.",
  },
];

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const isLast = step === ONBOARDING_STEPS.length - 1;
  const current = ONBOARDING_STEPS[step];
  const Icon = current.icon;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: 780,
        padding: "28px 26px 30px",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 12,
            color: T.textDim,
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 4,
          }}
        >
          bienvenue
        </div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Micro Scan</div>
      </div>

      {/* Étape animée */}
      <div
        key={step}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          animation: "stepIn 0.4s ease-out",
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: T.surface,
            border: `1px solid ${T.accentDim}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 26,
            animation: "iconPulse 2.2s ease-in-out infinite",
          }}
        >
          <Icon size={38} color={T.accent} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>
          {current.title}
        </div>
        <div
          style={{
            fontSize: 14,
            color: T.textDim,
            lineHeight: 1.55,
            maxWidth: 280,
          }}
        >
          {current.text}
        </div>
      </div>

      {/* Points + navigation */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 7,
            marginBottom: 22,
          }}
        >
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 20 : 7,
                height: 7,
                borderRadius: 4,
                background: i === step ? T.accent : T.surfaceLine,
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{
                flex: 1,
                padding: "13px 0",
                borderRadius: 12,
                background: "transparent",
                border: `1px solid ${T.surfaceLine}`,
                color: T.textDim,
                fontSize: 13.5,
                fontWeight: 500,
              }}
            >
              Précédent
            </button>
          )}
          <button
            onClick={() => (isLast ? onDone() : setStep((s) => s + 1))}
            style={{
              flex: 2,
              padding: "13px 0",
              borderRadius: 12,
              background: T.accent,
              border: "none",
              color: T.bg,
              fontSize: 13.5,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {isLast ? "Commencer" : "Suivant"}
            {!isLast && <ChevronRight size={16} />}
          </button>
        </div>
        {!isLast && (
          <button
            onClick={onDone}
            style={{
              width: "100%",
              marginTop: 10,
              background: "transparent",
              border: "none",
              color: T.textDim,
              fontSize: 12.5,
              padding: "6px 0",
            }}
          >
            Passer le guide
          </button>
        )}
      </div>

      <style>{`
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes iconPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(79,224,176,0.0); }
          50% { box-shadow: 0 0 0 10px rgba(79,224,176,0.06); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}

// ── Flux caméra réel du téléphone ────────────────────────────────
// Utilise getUserMedia pour ouvrir la caméra arrière automatiquement
// au montage de l'écran. Ne fonctionne que sur le site publié
// (Netlify/PWA) servi en HTTPS — pas dans un artifact de test.
function useCameraStream(videoRef, torchOn) {
  const [status, setStatus] = useState("idle"); // idle | requesting | active | denied | unsupported
  const streamRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        return;
      }
      setStatus("requesting");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" }, // caméra arrière
            width: { ideal: 1280 },
            height: { ideal: 1280 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setStatus("active");
      } catch (err) {
        setStatus(err?.name === "NotAllowedError" ? "denied" : "unsupported");
      }
    }

    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [videoRef]);

  // Torche : disponible uniquement si le matériel/navigateur le permet
  useEffect(() => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track) return;
    const capabilities = track.getCapabilities?.();
    if (capabilities?.torch) {
      track.applyConstraints({ advanced: [{ torch: torchOn }] }).catch(() => {});
    }
  }, [torchOn]);

  return status;
}

// ── Écran caméra avec cadrage manuel ───────────────────────────
function CameraScreen({
  torchOn,
  setTorchOn,
  zoom,
  setZoom,
  locked,
  setLocked,
  stage,
  onCapture,
  showToast,
  activeVideoRef,
}) {
  const capturing = stage === STAGES.CAPTURED;
  const videoRef = activeVideoRef;
  const cameraStatus = useCameraStream(videoRef, torchOn);

  useEffect(() => {
    if (cameraStatus === "active") {
      showToast("Caméra activée");
    } else if (cameraStatus === "denied") {
      showToast("Accès caméra refusé — autorise-le dans les réglages", "warn");
    } else if (cameraStatus === "unsupported") {
      showToast("Caméra non disponible sur cet aperçu", "warn");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraStatus]);

  const toggleTorch = () => {
    setTorchOn((v) => !v);
    showToast(!torchOn ? "Éclairage LED activé" : "Éclairage LED coupé");
  };

  const toggleLock = () => {
    const next = !locked;
    setLocked(next);
    showToast(
      next
        ? "Cadrage verrouillé — tu peux capturer"
        : "Cadrage déverrouillé — ajuste et recadre"
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 780 }}>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 16px 10px",
        }}
      >
        <IconBtn icon={<ChevronLeft size={20} />} label="Retour" />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.3 }}>
            Analyse macro
          </div>
          <div
            style={{
              fontSize: 11,
              color: T.textDim,
              fontFamily: "'JetBrains Mono', monospace",
              marginTop: 1,
            }}
          >
            clip 100–300x
          </div>
        </div>
        <IconBtn
          icon={torchOn ? <Zap size={18} /> : <ZapOff size={18} />}
          active={torchOn}
          onClick={toggleTorch}
          label="Éclairage"
        />
      </div>

      {/* Viewfinder */}
      <div
        style={{
          flex: 1,
          position: "relative",
          margin: "6px 14px",
          borderRadius: 20,
          overflow: "hidden",
          background:
            "radial-gradient(circle at 50% 45%, #1c2622 0%, #0c110f 72%)",
          border: `1px solid ${locked ? T.accentDim : T.surfaceLine}`,
          transition: "border-color 0.3s ease",
        }}
      >
        {cameraStatus === "active" ? (
        <div style={{position:"absolute", top:4, left:4, zIndex:99, background:"red", color:"white", padding:4, fontSize:12}}>DEBUG: {cameraStatus}</div>
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${zoom / 100})`,
              transformOrigin: "center",
              filter: torchOn ? "brightness(1.15)" : "none",
            }}
          />
        ) : (
          <> <div style={{position:"absolute", top:4, left:4, zIndex:99, background:"blue", color:"white", padding:4, fontSize:12}}>DEBUG2: {cameraStatus}</div>
            <video ref={videoRef} playsInline muted style={{ display: "none" }} />
            <SpecimenTexture zoom={zoom} torchOn={torchOn} />
            {(cameraStatus === "denied" || cameraStatus === "unsupported") && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 24,
                  textAlign: "center",
                  fontSize: 12,
                  color: T.textDim,
                }}
              >
                {cameraStatus === "denied"
                  ? "Caméra refusée — autorise l'accès dans les réglages du site pour voir l'échantillon en direct."
                  : "Aperçu simulé — la caméra réelle s'active une fois l'appli publiée en ligne (HTTPS)."}
              </div>
            )}
          </>
        )}
        <FramingGuide locked={locked} capturing={capturing} />

        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            background: "rgba(10,13,12,0.7)",
            border: `1px solid ${T.surfaceLine}`,
            borderRadius: 8,
            padding: "5px 9px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: T.accent,
          }}
        >
          {zoom}x
        </div>

        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "rgba(10,13,12,0.7)",
            border: `1px solid ${T.surfaceLine}`,
            borderRadius: 8,
            padding: "5px 9px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: T.textDim,
          }}
        >
          6–7mm
        </div>

        {!locked && !capturing && (
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 16,
              right: 16,
              textAlign: "center",
              fontSize: 12.5,
              color: T.text,
              background: "rgba(10,13,12,0.75)",
              borderRadius: 10,
              padding: "8px 10px",
              lineHeight: 1.4,
            }}
          >
            Approche la lentille de l'échantillon jusqu'à ce que
            <br />
            la zone soit nette, puis cale le repère au centre.
          </div>
        )}
        {locked && !capturing && (
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 16,
              right: 16,
              textAlign: "center",
              fontSize: 12.5,
              color: T.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <CheckCircle2 size={14} /> Cadrage verrouillé — prêt à capturer
          </div>
        )}
        {capturing && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(10,13,12,0.55)",
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: T.accent,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <ScanLine size={16} />
              capture en cours…
            </div>
          </div>
        )}
      </div>

      {/* Curseur de zoom manuel */}
      <div style={{ padding: "14px 22px 4px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: T.textDim,
            marginBottom: 6,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span>100x</span>
          <span>Ajuste le grossissement à la main</span>
          <span>300x</span>
        </div>
        <input
          type="range"
          min={100}
          max={300}
          step={10}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ width: "100%", accentColor: T.accent }}
        />
      </div>

      {/* Bottom controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 30px 30px",
        }}
      >
        <button
          onClick={toggleLock}
          style={{
            fontSize: 12,
            color: locked ? T.accent : T.textDim,
            background: "transparent",
            border: `1px solid ${locked ? T.accentDim : T.surfaceLine}`,
            borderRadius: 20,
            padding: "8px 14px",
            fontWeight: 500,
          }}
        >
          {locked ? "Déverrouiller" : "Verrouiller cadrage"}
        </button>

        <button
          onClick={onCapture}
          disabled={capturing}
          style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: locked ? T.accent : T.surface,
            border: `3px solid ${locked ? T.accent : T.surfaceLine}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          <Circle
            size={30}
            color={locked ? T.bg : T.textDim}
            fill={locked ? T.bg : "none"}
          />
        </button>

        <div style={{ width: 92 }} />
      </div>
    </div>
  );
}

function SpecimenTexture({ zoom, torchOn }) {
  const dots = Array.from({ length: 22 }, (_, i) => i);
  const scaleFactor = zoom / 180;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: torchOn ? 0.55 : 0.32,
        filter: torchOn ? "brightness(1.3)" : "none",
      }}
    >
      {dots.map((i) => {
        const seed = (i * 37) % 100;
        const size = (4 + (seed % 9)) * scaleFactor;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${(i * 17) % 92}%`,
              left: `${(i * 53) % 90}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              background:
                i % 5 === 0
                  ? "rgba(79,224,176,0.35)"
                  : "rgba(180,200,190,0.18)",
            }}
          />
        );
      })}
    </div>
  );
}

function FramingGuide({ locked, capturing }) {
  const color = locked ? T.accent : "rgba(231,243,238,0.55)";
  return (
    <svg
      viewBox="0 0 200 200"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {[
        [20, 20, 0],
        [180, 20, 90],
        [180, 180, 180],
        [20, 180, 270],
      ].map(([x, y, rot], i) => (
        <g key={i} transform={`translate(${x},${y}) rotate(${rot})`}>
          <path
            d="M -14 -2 L -14 -14 L -2 -14"
            stroke={color}
            strokeWidth={capturing ? 3 : 2}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      ))}
      <circle
        cx="100"
        cy="100"
        r="34"
        stroke={color}
        strokeWidth="1"
        fill="none"
        strokeDasharray="4 4"
      />
      <line x1="100" y1="88" x2="100" y2="94" stroke={color} strokeWidth="1.5" />
      <line x1="100" y1="106" x2="100" y2="112" stroke={color} strokeWidth="1.5" />
      <line x1="88" y1="100" x2="94" y2="100" stroke={color} strokeWidth="1.5" />
      <line x1="106" y1="100" x2="112" y2="100" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function IconBtn({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        background: active ? T.accentDim : T.surface,
        border: `1px solid ${active ? T.accent : T.surfaceLine}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? T.accent : T.text,
      }}
    >
      {icon}
    </button>
  );
}

// ── Écran résultat ──────────────────────────────────────────────
function ResultScreen({ onBack, zoom, showToast, capturedImage }) {
  const findings = [
    {
      level: "info",
      label: "Formes rondes régulières détectées",
      detail: "Compatible avec des grains de pollen ou débris organiques.",
    },
    {
      level: "warn",
      label: "Zone de texture irrégulière",
      detail:
        "Signe possible de développement fongique — à vérifier à l'œil nu sous une autre lumière.",
    },
  ];

  const handleSave = () => {
    showToast("Résultat enregistré dans l'historique");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 780 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "18px 16px 6px",
        }}
      >
        <IconBtn icon={<ChevronLeft size={20} />} label="Retour" onClick={onBack} />
        <div style={{ fontSize: 13, fontWeight: 600 }}>Résultat de capture</div>
      </div>

      <div
        style={{
          margin: "10px 14px",
          height: 200,
          borderRadius: 16,
          background:
            "radial-gradient(circle at 50% 45%, #1c2622 0%, #0c110f 75%)",
          border: `1px solid ${T.surfaceLine}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Échantillon capturé"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <SpecimenTexture zoom={zoom} torchOn={true} />
        )}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: T.accent,
            background: "rgba(10,13,12,0.7)",
            padding: "4px 8px",
            borderRadius: 6,
          }}
        >
          {zoom}x · capturé à l'instant
        </div>
      </div>

      <div
        style={{
          margin: "4px 14px 12px",
          padding: "10px 12px",
          borderRadius: 10,
          background: "rgba(255,180,84,0.08)",
          border: `1px solid rgba(255,180,84,0.25)`,
          display: "flex",
          gap: 8,
        }}
      >
        <HelpCircle size={16} color={T.warn} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 11.5, color: T.text, lineHeight: 1.45 }}>
          Analyse indicative basée sur l'image, pas un diagnostic. Les micro-organismes
          individuels (bactéries) restent invisibles à ce grossissement.
        </div>
      </div>

      <div style={{ flex: 1, padding: "0 14px", overflowY: "auto" }}>
        <div
          style={{
            fontSize: 11,
            color: T.textDim,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            marginBottom: 8,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Observations
        </div>
        {findings.map((f, i) => (
          <FindingCard key={i} finding={f} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, padding: "14px 16px 26px" }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            padding: "13px 0",
            borderRadius: 12,
            background: T.surface,
            border: `1px solid ${T.surfaceLine}`,
            color: T.text,
            fontSize: 13.5,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <RotateCcw size={15} /> Reprendre
        </button>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            padding: "13px 0",
            borderRadius: 12,
            background: T.accent,
            border: "none",
            color: T.bg,
            fontSize: 13.5,
            fontWeight: 600,
          }}
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}

function FindingCard({ finding }) {
  const isWarn = finding.level === "warn";
  const Icon = isWarn ? AlertTriangle : Circle;
  const color = isWarn ? T.warn : T.accent;
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "12px 12px",
        borderRadius: 12,
        background: T.surface,
        border: `1px solid ${T.surfaceLine}`,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          background: isWarn ? "rgba(255,180,84,0.12)" : "rgba(79,224,176,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={15} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 2 }}>
          {finding.label}
        </div>
        <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.4 }}>
          {finding.detail}
        </div>
      </div>
    </div>
  );
}
