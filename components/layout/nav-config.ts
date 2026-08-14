import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  ActivitySquare,
  GraduationCap,
  UserCog,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Academic",
    items: [
      { label: "Students", href: "/students", icon: Users },
      { label: "Courses", href: "/courses", icon: BookOpen },
      { label: "Attendance", href: "/attendance", icon: CalendarCheck },
      { label: "Assessments", href: "/assessments", icon: ClipboardList },
      { label: "Monitoring", href: "/monitoring", icon: ActivitySquare },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Tutors", href: "/tutors", icon: GraduationCap, adminOnly: true },
      { label: "Users", href: "/users", icon: UserCog, adminOnly: true },
    ],
  },
];
