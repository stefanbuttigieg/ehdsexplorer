export interface Recital {
  id: number;
  content: string;
  relatedArticles: number[];
}

export const recitals: Recital[] = [
  {
    id: 1,
    content: "The aim of this Regulation is to establish the European Health Data Space (EHDS) in order to improve natural persons' access to and control over their personal electronic health data in the context of healthcare, as well as to better achieve other purposes involving the use of electronic health data in the healthcare and care sectors that would benefit society, such as research, innovation, policymaking, health threats preparedness and response, including preventing and addressing future pandemics, patient safety, personalised medicine, official statistics or regulatory activities. In addition, this Regulation's goal is to improve the functioning of the internal market by laying down a uniform legal and technical framework in particular for the development, marketing and use of electronic health record systems ('EHR systems') in conformity with Union values. The EHDS will be a key element in the creation of a strong and resilient European Health Union.",
    relatedArticles: [1],
  },
  {
    id: 2,
    content: "The COVID-19 pandemic highlighted the imperative of having timely access to quality electronic health data for health threats preparedness and response, as well as for prevention, diagnosis and treatment and for secondary use of such electronic health data. Such timely access could potentially contribute, through efficient public health surveillance and monitoring, to more effective management of future pandemics, to a reduction of costs and to improving the response to health threats, and ultimately could help to save more lives.",
    relatedArticles: [1],
  },
  {
    id: 3,
    content: "The COVID-19 crisis strongly cemented the work of the eHealth Network, a voluntary network of authorities responsible for digital health, as the main pillar for the development of contact-tracing and contact-warning applications for mobile devices and the technical aspects of the EU Digital COVID Certificates. It also highlighted the need for sharing electronic health data that are findable, accessible, interoperable and reusable (the 'FAIR principles'), and ensuring that electronic health data are as open as possible, while respecting the data minimisation principle.",
    relatedArticles: [1],
  },
  {
    id: 4,
    content: "Given the sensitivity of personal electronic health data, this Regulation seeks to provide sufficient safeguards at both Union and national level to ensure a high degree of data protection, security, confidentiality and ethical use. Such safeguards are necessary to promote trust in safe handling of electronic health data of natural persons for primary use and secondary use as defined in this Regulation.",
    relatedArticles: [2],
  },
  {
    id: 5,
    content: "The processing of personal electronic health data is subject to the provisions of Regulation (EU) 2016/679 and, for Union institutions, bodies, offices and agencies, of Regulation (EU) 2018/1725 of the European Parliament and of the Council. References to the provisions of Regulation (EU) 2016/679 should be understood also as references to the corresponding provisions of Regulation (EU) 2018/1725 for Union institutions, bodies, offices and agencies, where relevant.",
    relatedArticles: [2],
  },
  {
    id: 6,
    content: "More and more individuals living in the Union cross national borders to work, study, visit relatives, or for other reasons. To facilitate the exchange of health data, and in line with the need to empower citizens, they should be able to access their health data in an electronic format that can be recognised and accepted across the Union. Such personal electronic health data could include personal data related to the physical or mental health of a natural person, including related to the provision of healthcare services.",
    relatedArticles: [2],
  },
  {
    id: 7,
    content: "In health systems, personal electronic health data are usually gathered in electronic health records, which typically contain a natural person's medical history, diagnoses and treatment, medications, allergies and vaccinations, as well as radiology images, laboratory results and other medical data, spread between different actors in the health system, such as general practitioners, hospitals, pharmacies or care services.",
    relatedArticles: [2],
  },
  {
    id: 8,
    content: "Regulation (EU) 2016/679 sets out specific provisions concerning the rights of natural persons in relation to the processing of their personal data. The EHDS builds upon those rights and complements some of them as applied to personal electronic health data. Those rights apply regardless of the Member State in which the personal electronic health data are processed, type of healthcare provider, sources of those data or Member State of affiliation of the natural person.",
    relatedArticles: [3],
  },
  {
    id: 9,
    content: "While the rights conferred by Regulation (EU) 2016/679 should continue to apply, the right of access to data by a natural person, established in Regulation (EU) 2016/679, should be further complemented in the healthcare sector. Under that Regulation, controllers do not have to provide access immediately. It is therefore necessary to provide for a more efficient way for natural persons to access their own personal electronic health data.",
    relatedArticles: [3],
  },
  {
    id: 10,
    content: "It should be considered that immediate access of natural persons to certain categories of their personal electronic health data could be harmful for the safety of those natural persons or unethical. For example, it could be unethical to inform a patient through an electronic channel about a diagnosis of an incurable disease that is likely to be terminal instead of first providing that information in a consultation with the patient.",
    relatedArticles: [3],
  },
  {
    id: 11,
    content: "This Regulation does not affect Member States' competences concerning the initial registration of personal electronic health data, such as making the registration of genetic data subject to the natural person's consent or other safeguards. Member States may require that data be made available in an electronic format prior to the application of this Regulation.",
    relatedArticles: [4],
  },
  {
    id: 12,
    content: "In order to complement the information available to them, natural persons should be able to add electronic health data to their EHRs or to store additional information in their separate personal health record which could be accessed by health professionals. However, information inserted by natural persons might not be as reliable as electronic health data entered and verified by health professionals and does not have the same clinical or legal value.",
    relatedArticles: [4, 5],
  },
  {
    id: 13,
    content: "Enabling natural persons to more easily and quickly access their personal electronic health data will enable them to notice possible errors such as incorrect information or incorrectly attributed patient records. In such cases, natural persons should be able to request online the rectification of the incorrect personal electronic health data, immediately and free of charge, through an electronic health data access service.",
    relatedArticles: [6],
  },
  {
    id: 14,
    content: "Under Regulation (EU) 2016/679, the right to data portability is limited to data processed based on consent or contract and provided by the data subject to a controller. Additionally, under that Regulation, natural persons have the right to have the personal data transmitted directly from one controller to another only where technically feasible. The right to data portability should be complemented under this Regulation.",
    relatedArticles: [7],
  },
  {
    id: 15,
    content: "The framework laid down by this Regulation should build on the right to data portability established in Regulation (EU) 2016/679 by ensuring that natural persons as data subjects can transmit their personal electronic health data, including inferred data, in the European electronic health record exchange format, irrespective of the legal basis for processing the electronic health data.",
    relatedArticles: [7],
  },
  {
    id: 16,
    content: "Access to electronic health records by healthcare providers or other individuals should be transparent to the natural persons concerned. Electronic health data access services should provide detailed information on access to data, such as when and which entity or natural person accessed data and which data were accessed.",
    relatedArticles: [9],
  },
  {
    id: 17,
    content: "Natural persons might not want to allow access to some parts of their personal electronic health data while enabling access to other parts. This could especially be relevant in cases of sensitive health issues such as those related to mental or sexual health, sensitive procedures such as abortions, or data on specific medication which could reveal other sensitive issues. Such selective sharing of personal electronic health data should therefore be supported.",
    relatedArticles: [8],
  },
  {
    id: 18,
    content: "In addition, due to the different sensitivities in the Member States on the degree of patients' control over their health data, Member States should be able to provide for an absolute right to opt out from access to their personal electronic health data by anyone other than the original controller, without any possibility to override that opt-out in emergency situations.",
    relatedArticles: [10],
  },
  {
    id: 19,
    content: "Healthcare is characterised by asymmetries of information. When providing services to patients, health professionals rely on medical records, which document the medical history of the patient. Without such documentation, health professionals would rely on information provided by the patient, which could be incomplete or inaccurate.",
    relatedArticles: [11, 12],
  },
  {
    id: 20,
    content: "Access to electronic health records is essential for continuity of care, that is, ensuring that the natural person receives coherent and well-coordinated care, in particular if such person is treated by several health professionals and if the treatment is provided across borders.",
    relatedArticles: [11, 12],
  },
  {
    id: 21,
    content: "The interoperability of electronic prescriptions and electronic dispensations across borders is essential for patient safety, as it allows healthcare providers to be aware of medications that the patient has been prescribed, even when treatments occur in different Member States.",
    relatedArticles: [13],
  },
  {
    id: 22,
    content: "The priority categories of personal electronic health data reflect the most commonly used categories and those for which there was most experience in terms of cross-border exchange. Those categories include patient summaries, electronic prescriptions, electronic dispensations, medical images and image reports, laboratory results and hospital discharge reports.",
    relatedArticles: [14],
  },
  {
    id: 23,
    content: "The Commission should be empowered to adopt delegated acts to amend the list of priority categories, taking into account the state of implementation and technological developments in the area of digital health.",
    relatedArticles: [14],
  },
  {
    id: 24,
    content: "In order to ensure the interoperability and consistency of personal electronic health data, the Commission should establish a European electronic health record exchange format. The format should be based on existing European and international standards and should enable the exchange of health data in a structured manner.",
    relatedArticles: [15],
  },
  {
    id: 25,
    content: "The European electronic health record exchange format should be based on the technical specifications developed by the eHealth Network and should take into account applicable international and European standards. The format should evolve over time in line with technological developments.",
    relatedArticles: [15],
  },
  {
    id: 26,
    content: "Healthcare providers should be required to register relevant electronic health data in the priority categories and to make them available to natural persons and health professionals in accordance with the provisions of this Regulation.",
    relatedArticles: [16],
  },
  {
    id: 27,
    content: "Digital health authorities should be responsible for the implementation and enforcement of the provisions on primary use at national level. They should have the necessary powers and resources to perform their tasks effectively and independently.",
    relatedArticles: [19],
  },
  {
    id: 28,
    content: "Each Member State should designate one or more digital health authorities. Where a Member State designates more than one digital health authority, it should designate one to act as coordinator. The digital health authorities should cooperate with each other and with other relevant authorities.",
    relatedArticles: [19],
  },
  {
    id: 29,
    content: "MyHealth@EU should be established as a central interoperability platform for digital health to enable cross-border exchange of personal electronic health data. Each Member State should designate a national contact point for digital health which should be connected to MyHealth@EU.",
    relatedArticles: [23],
  },
  {
    id: 30,
    content: "The exchange of personal electronic health data through MyHealth@EU should be based on the European electronic health record exchange format. Member States should ensure that healthcare providers are connected to their national contact points.",
    relatedArticles: [23],
  },
  {
    id: 31,
    content: "The Commission should adopt implementing acts laying down the technical requirements for MyHealth@EU, including requirements concerning security, interoperability and the protection of personal data.",
    relatedArticles: [23],
  },
  {
    id: 32,
    content: "This Regulation establishes a regulatory framework for EHR systems that are intended to be placed on the market or put into service in the Union. The framework aims to ensure that EHR systems meet essential requirements for interoperability, security, safety and logging.",
    relatedArticles: [27],
  },
  {
    id: 33,
    content: "Where an EHR system constitutes also a medical device or includes high-risk AI systems, the requirements of this Regulation should apply in addition to the requirements of the relevant Union legislation.",
    relatedArticles: [27],
  },
  {
    id: 55,
    content: "A wide range of electronic health data should be available for secondary use, including data from electronic health records, disease registries, biobanks, clinical trials, medical devices, and administrative databases.",
    relatedArticles: [52],
  },
  {
    id: 56,
    content: "The categories of electronic health data for secondary use should cover most health-related data, while respecting intellectual property rights and trade secrets.",
    relatedArticles: [52],
  },
  {
    id: 57,
    content: "The Commission should be empowered to adopt delegated acts to amend the list of categories of electronic health data for secondary use.",
    relatedArticles: [52],
  },
  {
    id: 58,
    content: "Access to electronic health data for secondary use should be granted only for specific permitted purposes that benefit society, such as public health, research, innovation, and policy-making.",
    relatedArticles: [53],
  },
  {
    id: 59,
    content: "The permitted purposes for secondary use include activities for reasons of public interest in the area of public health, scientific research, development and innovation activities, and regulatory purposes.",
    relatedArticles: [53],
  },
  {
    id: 60,
    content: "Certain purposes should be prohibited for secondary use, including taking decisions detrimental to natural persons, insurance underwriting, advertising, and developing harmful products.",
    relatedArticles: [53],
  },
  {
    id: 61,
    content: "Access to electronic health data should be refused where the purpose would be harmful to natural persons or society.",
    relatedArticles: [53],
  },
  {
    id: 65,
    content: "Health data access bodies should be responsible for granting access to electronic health data for secondary use. They should process applications, issue data permits, and ensure compliance with the conditions of access.",
    relatedArticles: [67],
  },
  {
    id: 66,
    content: "Each Member State should designate one or more health data access bodies. These bodies should have the necessary resources and expertise to perform their tasks effectively.",
    relatedArticles: [67],
  },
  {
    id: 67,
    content: "Health data access bodies should operate secure processing environments for the processing of electronic health data for secondary use.",
    relatedArticles: [67],
  },
  {
    id: 80,
    content: "HealthData@EU should be established as a cross-border infrastructure for secondary use of electronic health data. The infrastructure should connect national contact points and enable cross-border access to electronic health data for research, innovation and policy-making.",
    relatedArticles: [81],
  },
  {
    id: 81,
    content: "Each Member State should designate a national contact point for secondary use which should be connected to HealthData@EU. The Commission should adopt implementing acts for the technical development of the infrastructure.",
    relatedArticles: [81],
  },
  {
    id: 82,
    content: "HealthData@EU should support the FAIR principles by making electronic health data findable, accessible, interoperable and reusable for secondary use purposes.",
    relatedArticles: [81],
  },
  {
    id: 87,
    content: "The EHDS Board should be established to facilitate cooperation among Member States and ensure consistent application of this Regulation. The Board should be composed of representatives of digital health authorities and health data access bodies.",
    relatedArticles: [92],
  },
  {
    id: 88,
    content: "The EHDS Board should have advisory functions and should assist the Commission in ensuring consistent application of this Regulation across the Union.",
    relatedArticles: [92],
  },
  {
    id: 95,
    content: "This Regulation should enter into force on the twentieth day following its publication in the Official Journal. It should apply from 26 March 2027, with certain provisions applying at later dates to allow time for implementation.",
    relatedArticles: [99],
  },
  {
    id: 96,
    content: "Given the complexity of establishing the necessary infrastructure, Chapter III should apply from 26 March 2029, and the provisions on cross-border infrastructure should apply at staggered dates.",
    relatedArticles: [99],
  },
];

export function getRecitalById(id: number): Recital | undefined {
  return recitals.find((r) => r.id === id);
}

export function getRecitalsByArticle(articleId: number): Recital[] {
  return recitals.filter((r) => r.relatedArticles.includes(articleId));
}

export function searchRecitals(query: string): Recital[] {
  const lowerQuery = query.toLowerCase();
  return recitals.filter((r) => r.content.toLowerCase().includes(lowerQuery));
}
