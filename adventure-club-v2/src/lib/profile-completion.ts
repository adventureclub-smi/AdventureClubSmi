// Shared between the student's own Profile page and the admin's Member
// Profile page, so "what counts as complete" can't drift between the two
// views showing the same underlying account.

import { SMI, FACULTY } from "@/lib/academic-options";

export type ProfileCompletionInput = {
  fullName: string;
  dateOfBirth: string | null;
  bloodGroup: string | null;
  collegeRollNumber: string | null;
  phoneNumber: string;
  upiId: string | null;
  upiPhone: string | null;
  institution: string;
  department: string;
  year: string;
  emergencyContactName: string | null;
  emergencyContactRelation: string | null;
  emergencyContactPhone: string | null;
  govtIdType: string | null;
  govtIdNumber: string | null;
  govtIdImageUrl: string | null;
};

export function getProfileCompletion(user: ProfileCompletionInput) {
  // "Department" actually stores the SMI-only Program picker (B.Des, M.Des,
  // PhD, ...) — neither non-SMI students nor Faculty ever get a field for
  // it (see SignupForm/Profile), so requiring it there made 100% completion
  // permanently unreachable for anyone outside that one case.
  const departmentApplies = user.institution === SMI && user.year !== FACULTY;

  const requiredFields = [
    { label: "Full Name", filled: !!user.fullName },
    { label: "Date of Birth", filled: !!user.dateOfBirth },
    { label: "Blood Group", filled: !!user.bloodGroup },
    { label: "College Roll Number", filled: !!user.collegeRollNumber },
    { label: "Phone Number", filled: !!user.phoneNumber },
    { label: "UPI ID", filled: !!user.upiId },
    { label: "UPI Phone Number", filled: !!user.upiPhone },
    { label: "Institution", filled: !!user.institution },
    { label: "Department", filled: !departmentApplies || !!user.department },
    { label: "Year", filled: !!user.year },
    { label: "Emergency Contact Name", filled: !!user.emergencyContactName },
    { label: "Emergency Contact Relation", filled: !!user.emergencyContactRelation },
    { label: "Emergency Contact Phone", filled: !!user.emergencyContactPhone },
    {
      label: "Government ID",
      filled: !!(user.govtIdType && user.govtIdNumber && user.govtIdImageUrl),
    },
  ];

  const filledCount = requiredFields.filter((f) => f.filled).length;
  const percent = Math.round((filledCount / requiredFields.length) * 100);

  return {
    requiredFields,
    missingFields: requiredFields.filter((f) => !f.filled),
    percent,
    isComplete: percent === 100,
  };
}
