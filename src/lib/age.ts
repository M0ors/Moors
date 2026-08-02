export function getAge(dateOfBirth: string | Date | null | undefined) {
  if (!dateOfBirth) {
    return null;
  }

  const dob = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  if (Number.isNaN(dob.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age;
}

export function isAtLeast18(dateOfBirth: string | Date | null | undefined) {
  const age = getAge(dateOfBirth);
  return age !== null && age >= 18;
}
