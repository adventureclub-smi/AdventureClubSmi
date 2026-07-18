// The signup form's stored institution value for SMI students has been the
// full descriptive name ("Srishti Manipal Institute of Art, Design and
// Technology (SMI)") since early on, but older accounts and manually-added
// participants may only have the shorter "Srishti Manipal Institute" or a
// bare "SMI" — a plain `=== "smi"` check missed all of those.
export function isSmiInstitution(institution: string) {
  const value = institution.toLowerCase();
  return value.includes("srishti manipal") || value === "smi";
}
