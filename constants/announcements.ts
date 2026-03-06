export interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 1,
    title: "Q4 Performance Reviews Approaching",
    content: "Please ensure all your performance review data is submitted by the end of the month. The review cycle will officially kick off next week.",
    date: "2025-09-28",
  },
  {
    id: 2,
    title: "Welcome to our new seasonal workers!",
    content: "A big welcome to the 800+ seasonal workers joining us for the harvest season. We're thrilled to have you on the team!",
    date: "2025-09-25",
  },
  {
    id: 3,
    title: "Reminder: Health & Safety Training",
    content: "All employees are reminded that the mandatory Health & Safety training must be completed by October 15th. Please access the module in the Training Center.",
    date: "2025-09-22",
  },
];