export interface Definition {
  term: string;
  definition: string;
  articleReference: string;
}

export const definitions: Definition[] = [
  {
    term: "Personal electronic health data",
    definition: "Data concerning the health of an identified or identifiable natural person, as referred to in Article 4, point (15), of Regulation (EU) 2016/679, which is processed in an electronic form.",
    articleReference: "Art. 2(a)",
  },
  {
    term: "Non-personal electronic health data",
    definition: "Electronic health data that does not relate to an identified or identifiable natural person or electronic health data that has been rendered anonymous in such a manner that the data subject is not or no longer identifiable.",
    articleReference: "Art. 2(b)",
  },
  {
    term: "Electronic health data",
    definition: "Personal electronic health data and non-personal electronic health data.",
    articleReference: "Art. 2(c)",
  },
  {
    term: "Primary use",
    definition: "The processing of personal electronic health data for the provision of healthcare to assess, maintain or restore the state of health of the natural person to whom those data relate, including the prescription and dispensation of medicinal products and medical devices, as well as for relevant social security, administrative or reimbursement services.",
    articleReference: "Art. 2(d)",
  },
  {
    term: "Secondary use",
    definition: "The processing of electronic health data for purposes other than primary use, in accordance with Chapter IV of this Regulation.",
    articleReference: "Art. 2(e)",
  },
  {
    term: "Interoperability",
    definition: "The ability of organisations, as well as software applications or devices from the same manufacturer or different manufacturers, to interact towards mutually beneficial goals, involving the exchange of information and knowledge, without changing the content of the data between the organisations, software applications or devices, through the processes they support.",
    articleReference: "Art. 2(f)",
  },
  {
    term: "Registration of electronic health data",
    definition: "The recording of health data in an electronic format, through the manual entry of such data, through the collection of such data by a device, or through the conversion of non-electronic health data into an electronic format, to be processed in an EHR system or a wellness application.",
    articleReference: "Art. 2(g)",
  },
  {
    term: "Electronic health data access service",
    definition: "An online service, such as a portal or an application for mobile devices, that enables natural persons not acting in a professional capacity to access their own electronic health data or the electronic health data of those natural persons whose electronic health data they are legally authorised to access.",
    articleReference: "Art. 2(h)",
  },
  {
    term: "Health professional access service",
    definition: "A service, supported by an EHR system, that enables health professionals to access data of natural persons under their treatment.",
    articleReference: "Art. 2(i)",
  },
  {
    term: "Electronic health record (EHR)",
    definition: "A collection of electronic health data related to a natural person and collected in the health system, processed for the purpose of the provision of healthcare.",
    articleReference: "Art. 2(j)",
  },
  {
    term: "Electronic health record system (EHR system)",
    definition: "Any system whereby the software, or a combination of the hardware and the software of that system, allows personal electronic health data that belong to the priority categories of personal electronic health data established under this Regulation to be stored, intermediated, exported, imported, converted, edited or viewed, and intended by the manufacturer to be used by healthcare providers when providing patient care or by patients when accessing their electronic health data.",
    articleReference: "Art. 2(k)",
  },
  {
    term: "Putting into service",
    definition: "The first use, for its intended purpose, in the Union of an EHR system covered by this Regulation.",
    articleReference: "Art. 2(l)",
  },
  {
    term: "Software component",
    definition: "A discrete part of software which provides a specific functionality or performs specific functions or procedures and which can operate independently or in conjunction with other components.",
    articleReference: "Art. 2(m)",
  },
  {
    term: "European interoperability software component for EHR systems",
    definition: "A software component of the EHR system which provides and receives personal electronic health data under a priority category for primary use established under this Regulation in the European electronic health record exchange format provided for in this Regulation and which is independent of the European logging software component for EHR systems.",
    articleReference: "Art. 2(n)",
  },
  {
    term: "European logging software component for EHR systems",
    definition: "A software component of the EHR system which provides logging information related to access by health professionals or other individuals to priority categories of personal electronic health data established under this Regulation, in the format defined in point 3.2. of Annex II thereto, and which is independent of the European interoperability software component for EHR systems.",
    articleReference: "Art. 2(o)",
  },
  {
    term: "CE marking of conformity",
    definition: "A marking by which the manufacturer indicates that the EHR system is in conformity with the applicable requirements set out in this Regulation and other applicable Union law providing for its affixing pursuant to Regulation (EC) No 765/2008 of the European Parliament and of the Council.",
    articleReference: "Art. 2(p)",
  },
  {
    term: "Risk",
    definition: "The combination of the probability of an occurrence of a hazard causing harm to health, safety or information security and the degree of severity of such harm.",
    articleReference: "Art. 2(q)",
  },
  {
    term: "Serious incident",
    definition: "Any malfunction or deterioration in the characteristics or performance of an EHR system made available on the market that directly or indirectly leads, might have led or might lead to: (i) the death of a natural person or serious harm to a natural person's health; (ii) serious prejudice to a natural person's rights; (iii) serious disruption of the management and operation of critical infrastructure in the health sector.",
    articleReference: "Art. 2(r)",
  },
  {
    term: "Care",
    definition: "A professional service the purpose of which is to address the specific needs of a natural person who, on account of impairment or other physical or mental conditions, requires assistance, including preventive and supportive measures, to carry out essential activities of daily living in order to support his or her personal autonomy.",
    articleReference: "Art. 2(s)",
  },
  {
    term: "Health data holder",
    definition: "Any natural or legal person, public authority, agency or other body in the healthcare or the care sectors, including reimbursement services where necessary, as well as any natural or legal person developing products or services intended for the health, healthcare or care sectors, developing or manufacturing wellness applications, performing research in relation to the healthcare or care sectors or acting as a mortality registry, as well as any Union institution, body, office or agency, that has either the right or obligation to process personal electronic health data or the ability to make available non-personal electronic health data.",
    articleReference: "Art. 2(t)",
  },
  {
    term: "Health data user",
    definition: "A natural or legal person, including Union institutions, bodies, offices or agencies, which has been granted lawful access to electronic health data for secondary use pursuant to a data permit, a health data request approval or an access approval by an authorised participant in HealthData@EU.",
    articleReference: "Art. 2(u)",
  },
  {
    term: "Data permit",
    definition: "An administrative decision issued to a health data user by a health data access body to process certain electronic health data specified in the data permit for specific secondary use purposes, based on conditions laid down in Chapter IV of this Regulation.",
    articleReference: "Art. 2(v)",
  },
  {
    term: "Dataset",
    definition: "A structured collection of electronic health data.",
    articleReference: "Art. 2(w)",
  },
  {
    term: "Dataset of high impact for secondary use",
    definition: "A dataset the re-use of which is associated with significant benefits due to its relevance for health research.",
    articleReference: "Art. 2(x)",
  },
  {
    term: "Dataset catalogue",
    definition: "A collection of dataset descriptions, arranged in a systematic manner and including a user-oriented public part, in which information concerning individual dataset parameters is accessible by electronic means through an online portal.",
    articleReference: "Art. 2(y)",
  },
  {
    term: "Data quality",
    definition: "The degree to which the elements of electronic health data are suitable for their intended primary use and secondary use.",
    articleReference: "Art. 2(z)",
  },
  {
    term: "Data quality and utility label",
    definition: "A graphic diagram, including a scale, describing the data quality and conditions of use of a dataset.",
    articleReference: "Art. 2(aa)",
  },
  {
    term: "Wellness application",
    definition: "Any software, or any combination of hardware and software, intended by the manufacturer to be used by a natural person, for the processing of electronic health data, specifically for providing information on the health of natural persons, or the delivery of care for purposes other than the provision of healthcare.",
    articleReference: "Art. 2(ab)",
  },
  {
    term: "Healthcare provider",
    definition: "Any natural or legal person or any other entity legally providing healthcare on the territory of a Member State, or any natural person who is a health professional.",
    articleReference: "Art. 2(ac)",
  },
  {
    term: "Health professional",
    definition: "A doctor of medicine, a nurse responsible for general care, a dental practitioner, a midwife or a pharmacist within the meaning of Directive 2005/36/EC, or another professional exercising activities in the healthcare sector which are restricted to a regulated profession as defined in Article 3(1), point (a), of that Directive, or a person considered to be a health professional according to the national law of the Member State of treatment.",
    articleReference: "Art. 2(ad)",
  },
  {
    term: "Patient summary",
    definition: "A clinical document that includes essential personal electronic health data relating to a natural person and that is necessary to provide safe and efficient healthcare to that natural person, comprising the information specified in point 1 of Annex I.",
    articleReference: "Art. 2(ae)",
  },
  {
    term: "Electronic prescription",
    definition: "A prescription for a medicinal product as defined in Article 1, point (1), of Directive 2001/83/EC, issued and transmitted by electronic means by a health professional legally entitled to do so.",
    articleReference: "Art. 2(af)",
  },
  {
    term: "Electronic dispensation",
    definition: "Information about the supply of a medicinal product to a natural person by a pharmacy based on an electronic prescription.",
    articleReference: "Art. 2(ag)",
  },
  {
    term: "Medical image",
    definition: "Imaging data and associated metadata obtained through medical imaging devices.",
    articleReference: "Art. 2(ah)",
  },
  {
    term: "Image report",
    definition: "A document produced by a health professional containing the relevant clinical findings and interpretations of medical imaging data.",
    articleReference: "Art. 2(ai)",
  },
  {
    term: "Laboratory result",
    definition: "Data representing the outcome of tests carried out notably for diagnostic purposes, including associated metadata.",
    articleReference: "Art. 2(aj)",
  },
  {
    term: "Hospital discharge report",
    definition: "A clinical document relating to a healthcare encounter that provides relevant information about the admission, treatment and discharge of a natural person in a healthcare provider acting as a hospital.",
    articleReference: "Art. 2(ak)",
  },
  {
    term: "Secure processing environment",
    definition: "A physical or virtual environment and organisational means to ensure compliance with Union law, including Regulation (EU) 2016/679, in particular as regards data subjects' rights, intellectual property rights and commercial confidentiality, and with national law, and to allow the health data access body to determine and supervise all data processing actions, including viewing, downloading and any computation of electronic health data.",
    articleReference: "Art. 2(al)",
  },
  {
    term: "Health data access body",
    definition: "A body responsible for granting access to electronic health data for secondary use, as referred to in Article 67.",
    articleReference: "Art. 2(am)",
  },
  {
    term: "Health data request",
    definition: "A request for anonymised statistical information based on electronic health data submitted to a health data access body.",
    articleReference: "Art. 2(an)",
  },
  {
    term: "Digital health authority",
    definition: "An authority responsible for implementing and enforcing the provisions of Chapters II and III at national level, as referred to in Article 19.",
    articleReference: "Art. 2(ao)",
  },
  {
    term: "National contact point for digital health",
    definition: "An organisational and technical gateway for the provision of services linked to the cross-border exchange of personal electronic health data in the context of primary use.",
    articleReference: "Art. 2(ap)",
  },
  {
    term: "National contact point for secondary use",
    definition: "An organisational and technical gateway to the cross-border secondary use of electronic health data.",
    articleReference: "Art. 2(aq)",
  },
  {
    term: "MyHealth@EU",
    definition: "The cross-border infrastructure for primary use of personal electronic health data established pursuant to Article 23.",
    articleReference: "Art. 2(ar)",
  },
  {
    term: "HealthData@EU",
    definition: "The cross-border infrastructure for secondary use of electronic health data established pursuant to Article 81.",
    articleReference: "Art. 2(as)",
  },
  {
    term: "Authorised participant",
    definition: "A participant in HealthData@EU that has been authorised by the Commission to connect to that infrastructure pursuant to Article 84.",
    articleReference: "Art. 2(at)",
  },
  {
    term: "Anonymisation",
    definition: "The process of rendering personal data anonymous in such a manner that the data subject is not or is no longer identifiable.",
    articleReference: "Art. 2(au)",
  },
  {
    term: "Pseudonymisation",
    definition: "The processing of personal data in such a manner that the personal data can no longer be attributed to a specific data subject without the use of additional information, provided that such additional information is kept separately and is subject to technical and organisational measures to ensure that the personal data are not attributed to an identified or identifiable natural person.",
    articleReference: "Art. 2(av)",
  },
  {
    term: "EHDS Board",
    definition: "The European Health Data Space Board established pursuant to Article 92 to facilitate cooperation and the exchange of information among Member States.",
    articleReference: "Art. 2(aw)",
  },
  {
    term: "Telemedicine",
    definition: "The provision of healthcare at a distance through the use of information and communication technologies, which includes the interaction between the healthcare provider and the patient as well as the transmission of data, documents and other information between healthcare providers.",
    articleReference: "Art. 2(ax)",
  },
  {
    term: "Manufacturer",
    definition: "A natural or legal person who manufactures or has an EHR system designed, manufactured or developed and markets that EHR system under its name or trademark.",
    articleReference: "Art. 2(ay)",
  },
  {
    term: "Importer",
    definition: "A natural or legal person established in the Union who places an EHR system from a third country on the Union market.",
    articleReference: "Art. 2(az)",
  },
  {
    term: "Distributor",
    definition: "A natural or legal person in the supply chain, other than the manufacturer or the importer, who makes an EHR system available on the Union market.",
    articleReference: "Art. 2(ba)",
  },
  {
    term: "Authorised representative",
    definition: "A natural or legal person established in the Union who has received a written mandate from a manufacturer to act on its behalf in relation to specified tasks.",
    articleReference: "Art. 2(bb)",
  },
  {
    term: "Notified body",
    definition: "A conformity assessment body designated in accordance with this Regulation to carry out third-party conformity assessment activities.",
    articleReference: "Art. 2(bc)",
  },
  {
    term: "Conformity assessment",
    definition: "The process demonstrating whether the essential requirements relating to an EHR system have been fulfilled.",
    articleReference: "Art. 2(bd)",
  },
  {
    term: "Market surveillance",
    definition: "Activities and measures taken by market surveillance authorities to ensure that EHR systems comply with the requirements set out in this Regulation.",
    articleReference: "Art. 2(be)",
  },
  {
    term: "Recall",
    definition: "Any measure aimed at achieving the return of an EHR system that has already been made available to the end user.",
    articleReference: "Art. 2(bf)",
  },
  {
    term: "Withdrawal",
    definition: "Any measure aimed at preventing an EHR system in the supply chain from being made available on the market.",
    articleReference: "Art. 2(bg)",
  },
  {
    term: "European electronic health record exchange format",
    definition: "A structured, commonly used and machine-readable format that enables the transmission of personal electronic health data between different software systems, devices and healthcare providers.",
    articleReference: "Art. 2(bh)",
  },
  {
    term: "Data altruism",
    definition: "The voluntary sharing of data on the basis of the consent of data subjects or permission of data holders to process their personal and non-personal data without seeking or receiving a reward and for objectives of general interest.",
    articleReference: "Art. 2(bi)",
  },
  {
    term: "Genetic data",
    definition: "Personal data relating to the inherited or acquired genetic characteristics of a natural person which give unique information about the physiology or the health of that natural person and which result from an analysis of a biological sample from the natural person in question.",
    articleReference: "Art. 2(bj)",
  },
  {
    term: "Genomic data",
    definition: "Data relating to the entire genome sequence or part thereof of a natural person.",
    articleReference: "Art. 2(bk)",
  },
  {
    term: "Biobank",
    definition: "A collection of biological materials and associated data that are collected, stored and managed for research purposes.",
    articleReference: "Art. 2(bl)",
  },
  {
    term: "Clinical trial",
    definition: "A clinical study as defined in Article 2(2), point (2), of Regulation (EU) No 536/2014.",
    articleReference: "Art. 2(bm)",
  },
  {
    term: "Public health",
    definition: "All elements related to health, namely health status, including morbidity and disability, the determinants having an effect on that health status, healthcare needs, resources allocated to healthcare, the provision of, and universal access to, healthcare as well as healthcare expenditure and financing, and the causes of mortality.",
    articleReference: "Art. 2(bn)",
  },
  {
    term: "Official statistics",
    definition: "Statistics produced within the framework of the European Statistical System and in accordance with the provisions of Regulation (EC) No 223/2009.",
    articleReference: "Art. 2(bo)",
  },
];

export function searchDefinitions(query: string): Definition[] {
  const lowerQuery = query.toLowerCase();
  return definitions.filter(
    (d) =>
      d.term.toLowerCase().includes(lowerQuery) ||
      d.definition.toLowerCase().includes(lowerQuery)
  );
}
