export type AgeGroup = "10-13" | "14-17";

export interface ComicPanel {
  id: number;
  narration: string;
  dialogue?: { character: string; text: string }[];
  imagePrompt: string;
}

export interface ComicStory {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  ageGroup: AgeGroup;
  ehdsThemes: string[];
  articleReferences: number[];
  characterDescriptions?: string;
  coverPrompt: string;
  panels: ComicPanel[];
}

export const comicStories: ComicStory[] = [
  {
    id: "data-guardians",
    title: "The Data Guardians",
    subtitle: "Protecting Health Data Across Europe",
    description: "Follow Alex and Mia as they discover how the EHDS protects everyone's health data while making healthcare better across Europe.",
    ageGroup: "10-13",
    ehdsThemes: ["Patient rights", "Data protection", "Electronic health records"],
    articleReferences: [1, 3, 7],
    characterDescriptions: "Alex: 12-year-old boy, short brown curly hair, light brown skin, wearing a blue hoodie with a digital shield emblem, green sneakers. Mia: 12-year-old girl, long black straight hair in a ponytail, dark skin, wearing a purple jacket with a lock emblem, yellow sneakers. Professor Byte: friendly silver robot with round glasses, small antenna, kind blue LED eyes, bow tie.",
    coverPrompt: "A vibrant comic book cover showing two diverse teenage superheroes (a boy and a girl, age 12) in futuristic suits with shield emblems, standing protectively in front of a glowing digital health record hologram, with a map of Europe in the background. Bold title 'THE DATA GUARDIANS'. Colorful, kid-friendly comic style, no text.",
    panels: [
      {
        id: 1,
        narration: "In a world where health data travels across borders, two young heroes discover an important new law...",
        dialogue: [
          { character: "Alex", text: "Did you know that when you visit a doctor in another EU country, they can now access your health records?" },
          { character: "Mia", text: "Really? But how do they keep our information safe?" }
        ],
        imagePrompt: "Comic panel: Two diverse 12-year-old friends (a boy named Alex and a girl named Mia) sitting in a school library, looking at a tablet showing a digital health record. Bright, colorful comic book style. Speech bubbles space reserved at top."
      },
      {
        id: 2,
        narration: "The European Health Data Space — or EHDS — was created to solve exactly this problem!",
        dialogue: [
          { character: "Professor Byte", text: "The EHDS is like a secure digital bridge that lets your health information travel safely between countries!" }
        ],
        imagePrompt: "Comic panel: A friendly robot professor character with glasses explaining to two kids, pointing at a holographic display showing a bridge made of data connecting EU countries. Colorful comic style, educational feel."
      },
      {
        id: 3,
        narration: "But the best part? YOU are in control of your own health data!",
        dialogue: [
          { character: "Mia", text: "So I can decide who sees my health information?" },
          { character: "Professor Byte", text: "Exactly! You have the RIGHT to access, share, or restrict your data. It's YOUR health, YOUR data!" }
        ],
        imagePrompt: "Comic panel: A girl holding a glowing shield with a lock icon, standing confidently. Behind her, a transparent screen shows her health record with toggle switches for sharing. Empowering, bright comic style."
      },
      {
        id: 4,
        narration: "Health data isn't just about doctor visits — it helps researchers find cures too!",
        dialogue: [
          { character: "Alex", text: "Wait — so our health data can help scientists cure diseases?" },
          { character: "Professor Byte", text: "Yes! But only anonymized data — no one can tell it's yours. It helps researchers study patterns and develop new treatments!" }
        ],
        imagePrompt: "Comic panel: Scientists in a futuristic lab looking at anonymized data patterns on screens, with abstract representations of health data flowing in. Two kids watching amazed through a window. Colorful, hopeful comic style."
      },
      {
        id: 5,
        narration: "Together, the Data Guardians learned that the EHDS makes healthcare better for EVERYONE in Europe!",
        dialogue: [
          { character: "Alex", text: "So the EHDS protects our rights AND helps improve healthcare!" },
          { character: "Mia", text: "We're ALL Data Guardians — protecting and sharing data responsibly!" }
        ],
        imagePrompt: "Comic panel: The two kids standing as heroes with capes, overlooking a bright European cityscape where digital health data flows safely between hospitals. Triumphant, inspiring comic book finale style."
      }
    ]
  },
  {
    id: "myhealth-journey",
    title: "MyHealth Journey",
    subtitle: "When Data Saves the Day",
    description: "When Sofia travels from Spain to Germany and gets sick, the EHDS ensures doctors can access her records instantly — and save the day.",
    ageGroup: "10-13",
    ehdsThemes: ["Cross-border healthcare", "EHR access", "Emergency care"],
    articleReferences: [7, 8, 14],
    characterDescriptions: "Sofia: 12-year-old girl, shoulder-length wavy auburn hair, fair skin with freckles, wearing a red and yellow striped shirt (Spanish colors), denim jacket, carrying a green backpack. Mom: mid-30s woman, same auburn hair but longer, warm smile, wearing a cream blouse. Teacher: tall man with glasses, short blond hair, navy sweater. German Doctor: woman with short grey hair, white coat, kind smile, stethoscope.",
    coverPrompt: "A comic book cover showing a teenage girl with a backpack traveling across Europe (landmarks in background), with a glowing digital health card in her hand. Medical cross symbols and data streams connecting countries. Title 'MYHEALTH JOURNEY'. Warm, adventurous comic style, no text.",
    panels: [
      {
        id: 1,
        narration: "Sofia from Barcelona is going on a school trip to Berlin! But she has an important allergy...",
        dialogue: [
          { character: "Sofia", text: "Mom, what if I get sick in Germany? Will the doctors know about my allergies?" },
          { character: "Mom", text: "Don't worry! Thanks to the EHDS, your health summary can be accessed by doctors across Europe." }
        ],
        imagePrompt: "Comic panel: A 12-year-old girl packing a suitcase with her mom nearby, a digital health card glowing on the desk. A plane ticket to Berlin visible. Warm, reassuring comic style."
      },
      {
        id: 2,
        narration: "In Berlin, Sofia starts feeling unwell during a museum visit...",
        dialogue: [
          { character: "Sofia", text: "I don't feel well... my throat is swelling!" },
          { character: "Teacher", text: "Quick, we need to get to a hospital!" }
        ],
        imagePrompt: "Comic panel: A worried girl in a museum holding her throat, a concerned teacher reaching for a phone. Other students in background. Dramatic but not scary comic style."
      },
      {
        id: 3,
        narration: "At the Berlin hospital, the doctor uses the EHDS to access Sofia's patient summary...",
        dialogue: [
          { character: "Doctor", text: "I can see from her European Health Record that she's allergic to nuts! We know exactly how to treat this." }
        ],
        imagePrompt: "Comic panel: A friendly German doctor at a computer screen showing Sofia's health records with allergy alerts highlighted in red. The doctor looks relieved and confident. Medical setting, reassuring comic style."
      },
      {
        id: 4,
        narration: "Thanks to the EHDS, Sofia gets the right treatment immediately!",
        dialogue: [
          { character: "Sofia", text: "The doctors knew exactly what to do — even though I was in a different country!" },
          { character: "Doctor", text: "The European Health Data Space made sure your health information was available when you needed it most." }
        ],
        imagePrompt: "Comic panel: Sofia sitting up in a hospital bed, smiling and recovered, with the doctor giving a thumbs up. A digital health record hologram visible. Happy, relieved comic style."
      },
      {
        id: 5,
        narration: "Sofia's story shows why the EHDS matters — your health data follows you, so you're always safe!",
        dialogue: [
          { character: "Sofia", text: "Now I know my health data has my back, wherever I go in Europe!" }
        ],
        imagePrompt: "Comic panel: Sofia back with her classmates, healthy and happy, in front of the Brandenburg Gate. A subtle digital health shield icon appears above them. Uplifting, final panel comic style."
      }
    ]
  },
  {
    id: "research-heroes",
    title: "The Research Heroes",
    subtitle: "How Health Data Fights Disease",
    description: "Discover how anonymized health data from millions of people helps scientists fight rare diseases — all while protecting privacy.",
    ageGroup: "14-17",
    ehdsThemes: ["Secondary use of data", "Research", "Privacy", "Health data access bodies"],
    articleReferences: [33, 34, 46, 50],
    characterDescriptions: "Dr. Chen: mid-40s East Asian woman professor, long black hair in a bun, round silver glasses, wearing a white lab coat over a teal blouse. Kai: 16-year-old boy, tall, dark skin, short fade haircut, wearing an orange tech-pattern hoodie. Luna: 16-year-old girl, light skin, long curly red hair, green eyes, wearing a green turtleneck and denim overalls.",
    coverPrompt: "A comic book cover showing diverse teenage students in a futuristic research lab, analyzing holographic health data patterns. DNA helix and molecular structures float around them. A privacy shield emblem is prominent. Title 'THE RESEARCH HEROES'. Modern, sci-fi comic style, no text.",
    panels: [
      {
        id: 1,
        narration: "At the European Research Academy, students are learning about a groundbreaking approach to fighting rare diseases...",
        dialogue: [
          { character: "Dr. Chen", text: "What if I told you that health data from millions of people could help us find a cure for rare diseases — without anyone knowing whose data it is?" },
          { character: "Kai", text: "But how can you use people's medical data without invading their privacy?" }
        ],
        imagePrompt: "Comic panel: A diverse group of 16-year-old students in a futuristic classroom, a professor pointing at a holographic display showing anonymized health data patterns. Modern sci-fi comic style."
      },
      {
        id: 2,
        narration: "The EHDS allows researchers to access health data for important research — but with strict rules...",
        dialogue: [
          { character: "Dr. Chen", text: "Under the EHDS, researchers must apply to a Health Data Access Body. They never see personal details — only anonymized patterns." },
          { character: "Luna", text: "So it's like looking at the puzzle without knowing who the pieces belong to?" }
        ],
        imagePrompt: "Comic panel: A visualization showing health data being anonymized — personal details being removed and replaced with abstract patterns. A 'Health Data Access Body' building with a security checkpoint. Clean, modern comic style."
      },
      {
        id: 3,
        narration: "The students discover how this approach has already helped find patterns in rare diseases...",
        dialogue: [
          { character: "Kai", text: "This analysis found that a rare genetic condition affects people differently across EU countries!" },
          { character: "Luna", text: "And because the EHDS connects data from all member states, researchers can study much larger datasets than before." }
        ],
        imagePrompt: "Comic panel: Two students at futuristic workstations, seeing holographic maps of Europe with data patterns highlighted across different countries. Excited expressions. Sci-fi comic style."
      },
      {
        id: 4,
        narration: "But what about the people whose data is being used? The EHDS has strong safeguards...",
        dialogue: [
          { character: "Dr. Chen", text: "The data can only be used in secure processing environments. Researchers can't download it or identify individuals. And citizens have the right to opt out of secondary use." }
        ],
        imagePrompt: "Comic panel: A secure digital vault environment with layers of security shields. Data flows are visible but individual identities are hidden behind privacy shields. Protective, reassuring modern comic style."
      },
      {
        id: 5,
        narration: "The students realize that responsible data sharing can change the world...",
        dialogue: [
          { character: "Kai", text: "So the EHDS balances innovation with privacy — enabling research that saves lives while respecting individual rights." },
          { character: "Luna", text: "We can be both data-driven AND privacy-conscious. That's the future of healthcare!" }
        ],
        imagePrompt: "Comic panel: The students standing confidently, with a futuristic European cityscape behind them. Holographic health data streams flow around them, balanced by privacy shields. Inspiring, forward-looking comic finale."
      }
    ]
  },
  {
    id: "digital-rights",
    title: "Digital Rights Revolution",
    subtitle: "Know Your Health Data Rights",
    description: "When a tech-savvy teenager discovers companies misusing health data, she uses her EHDS rights to fight back — and teaches others to do the same.",
    ageGroup: "14-17",
    ehdsThemes: ["Digital rights", "Data portability", "Consent", "Transparency"],
    articleReferences: [3, 5, 7, 8],
    coverPrompt: "A comic book cover showing a determined teenage girl with a smartphone displaying health data rights, standing against a backdrop of tech company buildings. Digital rights symbols and EU flag elements. Title 'DIGITAL RIGHTS REVOLUTION'. Bold, modern protest-art comic style, no text.",
    panels: [
      {
        id: 1,
        narration: "Zara is 16 and knows her way around technology. One day, she makes a disturbing discovery...",
        dialogue: [
          { character: "Zara", text: "Wait — this wellness app has been sharing my health data with third parties? That can't be legal!" }
        ],
        imagePrompt: "Comic panel: A 16-year-old girl with short hair looking shocked at her phone screen, which shows a notification about data sharing. Her room has tech posters. Modern, edgy comic style."
      },
      {
        id: 2,
        narration: "Zara researches the EHDS and discovers she has powerful rights over her health data...",
        dialogue: [
          { character: "Zara", text: "Under the EHDS, I have the right to access ALL my electronic health data, control who can see it, and even get it in a portable format!" },
          { character: "Friend", text: "For real? We can actually control our own health data?" }
        ],
        imagePrompt: "Comic panel: The girl at a computer researching, with EU regulation documents on screen. A friend looking over her shoulder. Determination on their faces. Modern comic style with digital elements."
      },
      {
        id: 3,
        narration: "She discovers the EHDS gives citizens the right to restrict access to their data...",
        dialogue: [
          { character: "Zara", text: "Article 8 says I can restrict health professionals from accessing specific parts of my records. And Article 5 says I have the right to get my data in an interoperable format!" }
        ],
        imagePrompt: "Comic panel: The girl holding up a holographic display showing EHDS rights like a shield — right to access, right to restrict, right to portability. Empowering comic style."
      },
      {
        id: 4,
        narration: "Zara starts a school campaign to educate others about their digital health rights...",
        dialogue: [
          { character: "Zara", text: "Everyone deserves to know their health data rights! The EHDS protects us — but only if we know our rights exist." },
          { character: "Students", text: "We're in! Digital Rights Revolution!" }
        ],
        imagePrompt: "Comic panel: The girl presenting to a group of diverse teenagers in a school auditorium, a large screen behind her showing EHDS rights infographic. Students raising hands. Energetic, rally-like comic style."
      },
      {
        id: 5,
        narration: "Knowledge is power — and knowing your EHDS rights puts YOU in control of your health data.",
        dialogue: [
          { character: "Zara", text: "The EHDS isn't just a regulation — it's YOUR toolkit for taking control of your health data. Use it!" }
        ],
        imagePrompt: "Comic panel: Zara and her diverse group of friends standing united, each holding a glowing symbol of a different EHDS right. European landmarks in the background. Powerful, inspiring finale comic style."
      }
    ]
  }
];
