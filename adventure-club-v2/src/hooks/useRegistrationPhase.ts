"use client";

import { useEffect, useState } from "react";

export type RegistrationPhase = "opensIn" | "trekDay";

function computePhase(registrationOpensAt?: string | Date | null): RegistrationPhase {
  return registrationOpensAt && new Date(registrationOpensAt) > new Date()
    ? "opensIn"
    : "trekDay";
}

// A trek's homepage countdown has two phases: while registration hasn't
// opened yet, count down to `registrationOpensAt` ("Registrations Open In");
// once that passes (or there's no opensAt set at all), count down to the
// trek date instead ("Next Adventure In" for a visitor who hasn't
// registered — "Trek Starts In" once `hasRegistration` is true, since at
// that point it's no longer a pitch to sign up but an actual countdown to
// their own trip). This ticks its own 1s interval so the phase flips live
// without a page refresh right as opensAt passes.
export function useRegistrationPhase(
  trekDate: string | Date,
  registrationOpensAt?: string | Date | null,
  hasRegistration?: boolean
) {
  const [phase, setPhase] = useState<RegistrationPhase>(() =>
    computePhase(registrationOpensAt)
  );

  useEffect(() => {
    const update = () => setPhase(computePhase(registrationOpensAt));

    update();

    if (!registrationOpensAt) return;

    const timer = setInterval(update, 1000);

    return () => clearInterval(timer);
  }, [registrationOpensAt]);

  return {
    phase,
    target: phase === "opensIn" ? registrationOpensAt! : trekDate,
    label:
      phase === "opensIn"
        ? "Registrations Open In"
        : hasRegistration
        ? "Trek Starts In"
        : "Next Adventure In",
  };
}
