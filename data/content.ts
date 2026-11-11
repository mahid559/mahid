export type AccentKey = "pink" | "blue" | "yellow" | "mint";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  accent: AccentKey;
  index: string;
}

export interface SocialLink {
  label: "GitHub" | "LinkedIn" | "Facebook" | "Instagram" | "Fiverr";
  href: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  image: string;
  tags: string[];
  accent: AccentKey;
  href: string;
  featured?: boolean;
}

export interface ProcessStep {
  num: string;
  kicker: string;
  title: string;
  description: string;
  image: string;
  accent: AccentKey;
}

export interface TrackItem {
  code: string;
  title: string;
  accent: AccentKey;
}

export interface SkillItem {
  name: string;
  level: number; // 0-100
}

export interface SkillCategory {
  id: string;
  index: string;
  label: string;
  accent: AccentKey;
  accent2: AccentKey;
  items: SkillItem[];
}

export interface CoasterStop {
  id: string;
  num: string;
  period: string;
  role: string;
  company: string;
  summary: string;
  highlights: string[];
  accent: AccentKey;
  signText: string;
  photos: { src: string; caption: string }[];
}

export interface FaqItem {
  question: string;
  answer: string;
  accent: AccentKey;
}

export const ACCENT_HEX: Record<AccentKey, string> = {
  pink: "#E0206A",
  blue: "#2B4BFF",
  yellow: "#E09200",
  mint: "#00967F",
};

export const WIPE_COLORS = [
  "#F5B800",
  "#E0206A",
  "#00967F",
  "#2B4BFF",
  "#F2662A",
];

export const SITE_META = {
  title: "Mohammad Mahid | Front-End Developer, Next.js and React",
  description:
    "Front-end developer from Bangladesh building fast, responsive websites with Next.js, React, TypeScript and Tailwind CSS. Available for freelance projects.",
  firstName: "Mohammad",
  lastName: "Mahid",
  fullName: "Mohammad Mahid",
  role: "Front-End Developer",
  email: "mdmahid559@gmail.com",
  location: "Mymensingh, Bangladesh",
  timezone: "GMT+6 (Bangladesh)",
  availability: "Open to new projects",
  copyright: "© 2026 Mohammad Mahid",
  footerNote: "Built with Next.js and GSAP",
};

export const UI_LABELS = {
  loaderText: "NOW LOADING...✦",
  navbarConnector: "IS",
  drawerMenuLabel: "MENU",
  bopsUnit: "bops",
  flipButton: "Flip ↻",
  prevProjectAria: "Previous project",
  nextProjectAria: "Next project",
  prevStepAria: "Previous step",
  nextStepAria: "Next step",
  skillsCountSuffix: "SKILLS",
  skillsAvgLabel: "AVG. LEVEL",
  skillsMaxSuffix: "/100",
  coasterStopPrefix: "STOP",
  projectsAllFilter: "All",
  directEmailLabel: "Email",
  directLocationLabel: "Location",
  directTimezoneLabel: "Time Zone",
  directPhoneLabel: "Phone",
  copyLabel: "Copy",
  copiedLabel: "Copied ✓",
};

export const NAV_ITEMS: NavItem[] = [
  { id: "portfolio", label: "Portfolio", href: "#portfolio", accent: "pink", index: "01" },
  { id: "about", label: "About", href: "#about", accent: "blue", index: "02" },
  { id: "projects", label: "Projects", href: "#projects", accent: "yellow", index: "03" },
  { id: "contact", label: "Contact", href: "#contact", accent: "pink", index: "04" },
];

export const HIRE_ME_CTA = {
  label: "Hire me",
  href: "#contact",
};

export const BRAND_WORDS = [
  "FRONT-END DEVELOPER",
  "NEXT.JS BUILDER",
  "REACT DEVELOPER",
  "TAILWIND FAN",
  "CLEAN CODE",
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: "GitHub", href: "https://github.com/mahid559" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/mahid559" },
  { label: "Facebook", href: "https://www.facebook.com/mohammadmahid01" },
  { label: "Instagram", href: "https://www.instagram.com/mohammad__mahid/" },
  {
    label: "Fiverr",
    href: "https://www.fiverr.com/mahid559/build-responsive-nextjs-websites",
  },
];

export const PHONE_LINE = {
  label: "Phone",
  href: "tel:+8801728653722",
  display: "01728653722",
};

export const HERO_CONTENT = {
  leadPrefix: "I build fast, clean and responsive websites. ",
  leadHighlight: "Pixel by pixel.",
  primaryCta: {
    label: "See my work",
    href: "#projects",
  },
  secondaryCta: {
    label: "About me",
    href: "#about",
  },
  bopHintDesktop: "Swing my badge · catch the dot ·",
  bopHintTouch: "Tap anywhere · drag the badge ·",
  badge: {
    topPill: "DEV PASS",
    strapText: "NEXT.JS ✦ REACT ✦ TYPESCRIPT ✦ TAILWIND ✦ GSAP ✦ ",
    avatar: "/images/avatar-placeholder.svg",
    name: "Mohammad Mahid",
    role: "Front-End Developer",
    statusPill: "AVAILABLE FOR WORK",
    serial: "MM-2026 · MADE IN BANGLADESH",
    backHeading: "QUICK FACTS",
    stats: [
      { value: "7", label: "TECHNOLOGIES" },
      { value: "1", label: "LIVE FIVERR GIG" },
      { value: "2026", label: "DIPLOMA COMPLETED" },
      { value: "2", label: "LANGUAGES SPOKEN" },
    ],
  },
};

export const SELECTED_WORK_CONTENT = {
  kickerIndex: "[01]",
  kickerLabel: "SELECTED WORK",
  heading: "Selected work",
  allProjectsLabel: "All projects",
};

export const PROJECTS: ProjectItem[] = [
  {
    id: "proj-1",
    title: "[PROJECT 1]",
    category: "Web App",
    summary: "[ONE-LINE SUMMARY]",
    image: "/images/project-1.svg",
    tags: ["Next.js", "Tailwind CSS"],
    accent: "pink",
    href: "#",
    featured: true,
  },
  {
    id: "proj-2",
    title: "[PROJECT 2]",
    category: "E-Commerce",
    summary: "[ONE-LINE SUMMARY]",
    image: "/images/project-2.svg",
    tags: ["Next.js", "Tailwind CSS"],
    accent: "blue",
    href: "#",
    featured: true,
  },
  {
    id: "proj-3",
    title: "[PROJECT 3]",
    category: "SaaS",
    summary: "[ONE-LINE SUMMARY]",
    image: "/images/project-3.svg",
    tags: ["Next.js", "Tailwind CSS"],
    accent: "mint",
    href: "#",
    featured: true,
  },
];

export const PROCESS_CONTENT = {
  kickerIndex: "[02]",
  kickerLabel: "PROCESS",
  heading: "How I work",
  statement:
    "I listen first, design with care and code every page by hand, so your website looks sharp and loads fast on any device.",
  punchline: "Simple. Clear. Fast.",
  steps: [
    {
      num: "01",
      kicker: "01 / UNDERSTAND",
      title: "Let's talk first.",
      description:
        "You tell me your idea, audience and goals, and I turn them into a clear plan before writing any code.",
      image: "/images/process-1.svg",
      accent: "yellow",
    },
    {
      num: "02",
      kicker: "02 / BUILD",
      title: "Built with care.",
      description:
        "I code a clean, responsive website in Next.js and Tailwind CSS, with smooth animations where they help.",
      image: "/images/process-2.svg",
      accent: "pink",
    },
    {
      num: "03",
      kicker: "03 / DELIVER",
      title: "Live and polished.",
      description:
        "You get the full source code, a walkthrough and revisions until you are happy with the result.",
      image: "/images/process-3.svg",
      accent: "mint",
    },
  ] as ProcessStep[],
};

export const ABOUT_CONTENT = {
  kickerIndex: "[01]",
  kickerLabel: "ABOUT",
  heading: "About me",
  stickerText: "SIDE A",
  sleeveImage: "/images/sleeve-placeholder.svg",
  sleeveCaption: "MOHAMMAD MAHID",
  tracks: [
    { code: "A1", title: "Clean Code", accent: "pink" },
    { code: "A2", title: "Fast Sites", accent: "blue" },
    { code: "A3", title: "Sharp UI", accent: "yellow" },
    { code: "B1", title: "Smooth Moves", accent: "mint" },
    { code: "B2", title: "Clear Talk", accent: "pink" },
  ] as TrackItem[],
  bioParagraphs: [
    "I'm a front-end developer from Bangladesh who builds modern, responsive websites with Next.js, React, TypeScript and Tailwind CSS, with clean code and smooth animations.",
    "I recently completed my Diploma in Computer Science and Technology, and I now build landing pages, business websites and design-to-code recreations for clients worldwide.",
  ],
  bioHighlight: "front-end developer",
  codeSnippet: {
    varName: "profile",
    entries: [
      { key: "name", value: '"Mohammad Mahid"' },
      { key: "role", value: '"Front-End Developer"' },
      { key: "location", value: '"Mymensingh, Bangladesh"' },
      { key: "focus", value: '"Next.js and React"' },
      { key: "status", value: '"Open for projects"' },
    ],
  },
};

export const SKILLS_CONTENT = {
  kickerIndex: "[02]",
  kickerLabel: "SKILLS",
  heading: "What I use",
  categories: [
    {
      id: "frontend",
      index: "01",
      label: "Frontend",
      accent: "pink",
      accent2: "blue",
      items: [
        { name: "Next.js", level: 80 },
        { name: "React", level: 80 },
        { name: "TypeScript", level: 70 },
        { name: "JavaScript", level: 80 },
      ],
    },
    {
      id: "styling",
      index: "02",
      label: "Styling & Motion",
      accent: "blue",
      accent2: "mint",
      items: [
        { name: "Tailwind CSS", level: 85 },
        { name: "HTML & CSS", level: 85 },
        { name: "GSAP", level: 65 },
        { name: "Responsive Design", level: 85 },
      ],
    },
    {
      id: "tools",
      index: "03",
      label: "Tools",
      accent: "mint",
      accent2: "yellow",
      items: [
        { name: "Git & GitHub", level: 70 },
        { name: "VS Code", level: 85 },
        { name: "AI-assisted coding", level: 80 },
        { name: "Vercel", level: 65 },
      ],
    },
  ] as SkillCategory[],
};

export const COASTER_CONTENT = {
  kickerIndex: "[03]",
  kickerLabel: "EXPERIENCE",
  heading: "My journey",
  subtitle: "Scroll down and follow the road.",
  entryGate: "THE CAREER ROAD",
  endGate: "TO BE CONTINUED…",
  stops: [
    {
      id: "stop-1",
      num: "01",
      period: "2022 – 2026",
      role: "CST Diploma",
      company: "Computer Science and Technology",
      summary:
        "Studied computer science and technology and built a strong base in programming and web development.",
      highlights: ["Programming", "Web Basics", "Problem Solving"],
      accent: "pink",
      signText: "CAMPUS ROAD",
      photos: [
        { src: "/images/coaster-photo.svg", caption: "SNAPSHOT" },
        { src: "/images/coaster-photo.svg", caption: "SNAPSHOT" },
      ],
    },
    {
      id: "stop-2",
      num: "02",
      period: "2026",
      role: "Flutter Intern",
      company: "Dart and Flutter",
      summary:
        "Worked with Dart and Flutter during an internship and learned real app development workflows.",
      highlights: ["Dart", "Flutter", "Mobile UI"],
      accent: "blue",
      signText: "INTERN LANE",
      photos: [
        { src: "/images/coaster-photo.svg", caption: "SNAPSHOT" },
        { src: "/images/coaster-photo.svg", caption: "SNAPSHOT" },
      ],
    },
    {
      id: "stop-3",
      num: "03",
      period: "2026 – Now",
      role: "Freelance Developer",
      company: "Fiverr",
      summary:
        "Launched my Fiverr gig to build responsive Next.js websites and landing pages for clients worldwide.",
      highlights: ["Next.js", "Landing Pages", "Clients"],
      accent: "mint",
      signText: "OPEN ROAD",
      photos: [
        { src: "/images/coaster-photo.svg", caption: "SNAPSHOT" },
        { src: "/images/coaster-photo.svg", caption: "SNAPSHOT" },
      ],
    },
  ] as CoasterStop[],
};

export const PROJECTS_GRID_CONTENT = {
  kickerIndex: "[03]",
  kickerLabel: "ARCHIVE",
  heading: "All projects",
  subheadLabel: "ARCHIVE",
  visitLabel: "Visit site",
};

export const CONTACT_CONTENT = {
  kickerIndex: "[04]",
  kickerLabel: "CONTACT",
  heading: "Let's build something great",
  statusPill: "Open to new projects",
  form: {
    heading: "Send a message",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    subjectLabel: "Project type",
    subjectPlaceholder: "Project idea",
    messageLabel: "Message",
    messagePlaceholder: "Tell me about your project",
    submitLabel: "Send message →",
    sendingLabel: "Sending…",
    errorMessage:
      "Something went wrong sending your message. Please try again or email me directly.",
    sentTitlePrefix: "Thanks,",
    sentMessage:
      "Your message has been sent. I'll review it and reply to you soon.",
    sentStamp: "RECEIVED ✓",
    resetLabel: "Send another message",
  },
  directLinesHeading: "DIRECT LINES",
  faqHeading: "BEFORE YOU WRITE",
  faqs: [
    {
      question: "How much does a website cost?",
      answer:
        "It depends on the number of pages and features. Check my Fiverr gig for packages, or message me for a custom quote.",
      accent: "pink",
    },
    {
      question: "How long does it take?",
      answer:
        "A landing page usually takes a few days. Larger sites take longer, and I confirm the timeline before we start.",
      accent: "blue",
    },
    {
      question: "Do you offer revisions?",
      answer:
        "Yes. Revisions are included, and I keep refining the work until you are happy.",
      accent: "mint",
    },
  ] as FaqItem[],
};

export const BOTTOM_CTA_CONTENT = {
  heading: "Have a website in mind?",
  body: "Tell me about your project and I'll get back to you quickly.",
  buttonLabel: "Start a project →",
  buttonHref: "#contact",
};
