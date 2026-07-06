import { prisma } from "@/lib/prisma";

export type CertificateSettingsData = {
  facultyHeadName: string | null;
  facultyHeadSignatureUrl: string | null;
  presidentName: string | null;
  presidentSignatureUrl: string | null;
};

export async function getCertificateSettings(): Promise<CertificateSettingsData> {
  const settings = await prisma.certificateSettings.findFirst();

  return {
    facultyHeadName: settings?.facultyHeadName || null,
    facultyHeadSignatureUrl: settings?.facultyHeadSignatureUrl || null,
    presidentName: settings?.presidentName || null,
    presidentSignatureUrl: settings?.presidentSignatureUrl || null,
  };
}
