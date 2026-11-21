/**
 * Holiday helper — fetches holiday dates from DB as a Set<string> for SLA calculations
 */
import { prisma } from "./prisma";

export async function getHolidaySet(): Promise<Set<string>> {
  const holidays = await prisma.holiday.findMany();
  return new Set(
    holidays.map((h) => {
      const d = new Date(h.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })
  );
}
