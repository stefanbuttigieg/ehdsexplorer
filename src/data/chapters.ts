export interface Chapter {
  id: number;
  title: string;
  description: string;
  articleRange: [number, number];
  sections?: { title: string; articleRange: [number, number] }[];
}

export const chapters: Chapter[] = [
  {
    id: 1,
    title: "General Provisions",
    description: "Subject matter, scope, and definitions establishing the foundation of the EHDS framework.",
    articleRange: [1, 2],
  },
  {
    id: 2,
    title: "Primary Use",
    description: "Rights of natural persons regarding access to and control over their personal electronic health data for healthcare purposes.",
    articleRange: [3, 26],
    sections: [
      { title: "Rights of natural persons and related provisions", articleRange: [3, 18] },
      { title: "Governance for primary use", articleRange: [19, 22] },
      { title: "Cross-border infrastructure (MyHealth@EU)", articleRange: [23, 26] },
    ],
  },
  {
    id: 3,
    title: "EHR Systems and Wellness Applications",
    description: "Requirements for electronic health record systems placed on the market, including CE marking and conformity assessment.",
    articleRange: [27, 51],
    sections: [
      { title: "General provisions on EHR systems", articleRange: [27, 29] },
      { title: "Obligations of economic operators", articleRange: [30, 35] },
      { title: "Conformity of harmonised software components", articleRange: [36, 42] },
      { title: "Market surveillance", articleRange: [43, 48] },
      { title: "Registration of EHR systems", articleRange: [49, 50] },
      { title: "Wellness applications", articleRange: [51, 51] },
    ],
  },
  {
    id: 4,
    title: "Secondary Use",
    description: "Framework for accessing and processing electronic health data for research, innovation, policy-making, and other secondary purposes.",
    articleRange: [52, 75],
    sections: [
      { title: "Minimum categories and purposes", articleRange: [52, 54] },
      { title: "Data minimisation and access conditions", articleRange: [55, 61] },
      { title: "Obligations of health data holders", articleRange: [62, 66] },
      { title: "Health data access bodies", articleRange: [67, 75] },
    ],
  },
  {
    id: 5,
    title: "Additional Actions",
    description: "Support for data quality, interoperability standards, and capacity building across Member States.",
    articleRange: [76, 80],
  },
  {
    id: 6,
    title: "Cross-Border Infrastructure for Secondary Use",
    description: "Establishment and governance of HealthData@EU for cross-border secondary use of health data.",
    articleRange: [81, 87],
  },
  {
    id: 7,
    title: "International Access and Transfer",
    description: "Rules for international access to electronic health data and transfers to third countries.",
    articleRange: [88, 91],
  },
  {
    id: 8,
    title: "Governance",
    description: "Establishment and functions of the EHDS Board and coordination mechanisms.",
    articleRange: [92, 95],
  },
  {
    id: 9,
    title: "Delegation and Committee",
    description: "Provisions for delegated acts and committee procedures.",
    articleRange: [96, 98],
  },
  {
    id: 10,
    title: "Final Provisions",
    description: "Penalties, remedies, evaluation, amendments, and entry into force.",
    articleRange: [99, 105],
  },
];

export function getChapterByArticle(articleId: number): Chapter | undefined {
  return chapters.find(
    (ch) => articleId >= ch.articleRange[0] && articleId <= ch.articleRange[1]
  );
}

export function getChapterById(chapterId: number): Chapter | undefined {
  return chapters.find((ch) => ch.id === chapterId);
}
