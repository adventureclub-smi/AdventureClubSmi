// Recruitment only cares about the handful of fields it actually prefills
// onto the application (name, course, year, roll number, phone, email) —
// deliberately a much smaller set than getProfileCompletion's full 14-field
// checklist (govt ID, emergency contact, UPI, ...), none of which recruiters
// need to see an applicant's team preferences and portfolio.

import { SMI, FACULTY } from "@/lib/academic-options";

export type RecruitmentProfileInput = {
  fullName: string;
  email: string;
  phoneNumber: string;
  collegeRollNumber: string | null;
  institution: string;
  department: string;
  year: string;
};

export function getRecruitmentProfileGaps(user: RecruitmentProfileInput): string[] {
  const departmentApplies = user.institution === SMI && user.year !== FACULTY;

  const checks: [string, boolean][] = [
    ["Full Name", !!user.fullName],
    ["Email", !!user.email],
    ["Phone Number", !!user.phoneNumber],
    ["College Roll Number", !!user.collegeRollNumber],
    ["Year", !!user.year],
    ["Course", !departmentApplies || !!user.department],
  ];

  return checks.filter(([, filled]) => !filled).map(([label]) => label);
}
