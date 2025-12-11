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
];

export function searchDefinitions(query: string): Definition[] {
  const lowerQuery = query.toLowerCase();
  return definitions.filter(
    (d) =>
      d.term.toLowerCase().includes(lowerQuery) ||
      d.definition.toLowerCase().includes(lowerQuery)
  );
}
