export interface Article {
  id: number;
  title: string;
  content: string;
  relatedRecitals: number[];
  crossReferences: number[];
}

export const articles: Article[] = [
  {
    id: 1,
    title: "Subject matter",
    content: `This Regulation establishes the European Health Data Space (EHDS) by providing for:

(a) rules regarding the rights of natural persons in relation to the access to and control of their personal electronic health data;

(b) rules for electronic health record systems (EHR systems) intended to be placed on the market, put into service or used in the Union and for wellness applications in relation to the interoperability of EHR systems;

(c) common rules, standards and practices, infrastructures, and a governance framework for the primary use and secondary use of electronic health data;

(d) rules for the establishment and governance of MyHealth@EU, the central interoperability platform for digital health, and HealthData@EU, the cross-border infrastructure for secondary use.`,
    relatedRecitals: [1, 2, 3],
    crossReferences: [],
  },
  {
    id: 2,
    title: "Definitions",
    content: `For the purposes of this Regulation, the following definitions apply:

(a) 'personal electronic health data' means data concerning the health of an identified or identifiable natural person, as referred to in Article 4, point (15), of Regulation (EU) 2016/679, which is processed in an electronic form;

(b) 'non-personal electronic health data' means electronic health data that does not relate to an identified or identifiable natural person or electronic health data that has been rendered anonymous in such a manner that the data subject is not or no longer identifiable;

(c) 'electronic health data' means personal electronic health data and non-personal electronic health data;

(d) 'primary use' means the processing of personal electronic health data for the provision of healthcare to assess, maintain or restore the state of health of the natural person to whom those data relate, including the prescription and dispensation of medicinal products and medical devices, as well as for relevant social security, administrative or reimbursement services;

(e) 'secondary use' means the processing of electronic health data for purposes other than primary use, in accordance with Chapter IV of this Regulation;

(f) 'interoperability' means the ability of organisations, as well as software applications or devices from the same manufacturer or different manufacturers, to interact towards mutually beneficial goals, involving the exchange of information and knowledge, without changing the content of the data between the organisations, software applications or devices, through the processes they support;

(g) 'registration of electronic health data' means the recording of health data in an electronic format, through the manual entry of such data, through the collection of such data by a device, or through the conversion of non-electronic health data into an electronic format;

(h) 'electronic health data access service' means an online service that enables natural persons not acting in a professional capacity to access their own electronic health data or the electronic health data of those natural persons whose electronic health data they are legally authorised to access;

(i) 'health professional access service' means a service, supported by an EHR system, that enables health professionals to access data of natural persons under their treatment;

(j) 'electronic health record' or 'EHR' means a collection of electronic health data related to a natural person and collected in the health system, processed for the purpose of the provision of healthcare;

(k) 'electronic health record system' or 'EHR system' means any system whereby the software allows personal electronic health data that belong to the priority categories established under this Regulation to be stored, intermediated, exported, imported, converted, edited or viewed, and intended by the manufacturer to be used by healthcare providers or by patients;

(l) 'putting into service' means the first use, for its intended purpose, in the Union of an EHR system covered by this Regulation;

(m) 'software component' means a discrete part of software which provides a specific functionality or performs specific functions or procedures;

(n) 'European interoperability software component for EHR systems' means a software component of the EHR system which provides and receives personal electronic health data in the European electronic health record exchange format;

(o) 'European logging software component for EHR systems' means a software component of the EHR system which provides logging information related to access by health professionals to priority categories of personal electronic health data;

(p) 'CE marking of conformity' means a marking by which the manufacturer indicates that the EHR system is in conformity with the applicable requirements set out in this Regulation;

(q) 'risk' means the combination of the probability of an occurrence of a hazard causing harm and the degree of severity of such harm;

(r) 'serious incident' means any malfunction or deterioration in the characteristics or performance of an EHR system that directly or indirectly leads to death, serious harm to health, or serious disruption of critical infrastructure;

(s) 'care' means a professional service for addressing the specific needs of a natural person who requires assistance to carry out essential activities of daily living;

(t) 'health data holder' means any natural or legal person in the healthcare or care sectors that has the right or obligation to process personal electronic health data;

(u) 'health data user' means a natural or legal person which has been granted lawful access to electronic health data for secondary use pursuant to a data permit;

(v) 'data permit' means an administrative decision issued to a health data user by a health data access body to process certain electronic health data for specific secondary use purposes;

(w) 'dataset' means a structured collection of electronic health data;

(x) 'dataset of high impact for secondary use' means a dataset the re-use of which is associated with significant benefits due to its relevance for health research;

(y) 'dataset catalogue' means a collection of dataset descriptions, arranged in a systematic manner;

(z) 'data quality' means the degree to which the elements of electronic health data are suitable for their intended primary use and secondary use;

(aa) 'data quality and utility label' means a graphic diagram describing the data quality and conditions of use of a dataset;

(ab) 'wellness application' means any software intended by the manufacturer to be used by a natural person for the processing of electronic health data for providing information on health or care.`,
    relatedRecitals: [4, 5, 6, 7],
    crossReferences: [],
  },
  {
    id: 3,
    title: "Right of natural persons to access their personal electronic health data",
    content: `1. Natural persons shall have the right to access at least personal electronic health data relating to them that belong to the priority categories referred to in Article 14 and are processed for the provision of healthcare through the electronic health data access services referred to in Article 4. Access shall be provided immediately after the personal electronic health data have been registered in an EHR system, while respecting the need for technological practicability, and shall be provided free of charge and in an easily readable, consolidated and accessible format.

2. Natural persons, or their representatives referred to in Article 4(2), shall have the right to download free of charge an electronic copy of at least the personal electronic health data in the priority categories referred to in Article 14 related to those natural persons, through the electronic health data access services referred to in Article 4, in the European electronic health record exchange format referred to in Article 15.

3. In accordance with Article 23 of Regulation (EU) 2016/679, Member States may restrict the scope of rights provided for in paragraphs 1 and 2 of this Article, in particular whenever those restrictions are necessary to protect natural persons, on the basis of patient safety and ethical considerations by delaying access to their personal electronic health data for a limited period of time, for instance until the moment when the health professional is able to properly communicate and explain to the natural persons concerned information that can have a significant impact on their health.`,
    relatedRecitals: [8, 9, 10],
    crossReferences: [4, 14, 15],
  },
  {
    id: 4,
    title: "Electronic health data access services for natural persons and their representatives",
    content: `1. Member States shall ensure that one or more electronic health data access services at national, regional or local level are established, thereby enabling natural persons to access their personal electronic health data and exercise their rights provided for in Articles 3 and 5 to 10. Such electronic health data access services shall be free of charge for the natural persons and their representatives referred to in paragraph 2 of this Article.

2. Member States shall ensure that one or more proxy services are established as a functionality of electronic health data access services which enables:
(a) natural persons to authorise other natural persons of their choice to access their personal electronic health data, or part thereof, on their behalf for a limited or unlimited period and, if needed, for a specific purpose only, and to manage those authorisations; and
(b) legal representatives of natural persons to access personal electronic health data of those natural persons whose affairs they administer, in accordance with national law.

Member States shall establish rules regarding the authorisations referred to in point (a) of the first subparagraph and actions of guardians and other legal representatives.

3. The proxy services referred to in paragraph 2 shall provide authorisations in a transparent and easily understandable way, free of charge, and electronically or on paper. Natural persons and their representatives shall be informed about their authorisation rights, including about how to exercise those rights, and about the authorisation process. The proxy services shall provide an easy complaint mechanism for natural persons.

4. The proxy services referred to in paragraph 2 of this Article shall be interoperable among Member States. The Commission shall, by means of implementing acts, lay down the technical specifications for the interoperability of the proxy services of the Member States. Those implementing acts shall be adopted in accordance with the examination procedure referred to in Article 98(2).

5. The electronic health data access services and the proxy services shall be easily accessible for persons with disabilities, vulnerable groups and persons with low digital literacy.`,
    relatedRecitals: [11, 12],
    crossReferences: [3, 5, 6, 7, 8, 9, 10, 98],
  },
  {
    id: 5,
    title: "Right of natural persons to insert information in their own EHR",
    content: `Natural persons, or their representatives referred to in Article 4(2), shall have the right to insert information in the EHR of those natural persons through electronic health data access services or applications linked to those services as referred to in that Article. That information shall be clearly distinguishable as having been inserted by the natural person or by his or her representative. Natural persons, or their representatives referred to in Article 4(2), shall not be able to directly alter the electronic health data and related information inserted by health professionals.`,
    relatedRecitals: [12],
    crossReferences: [4],
  },
  {
    id: 6,
    title: "Right of natural persons to rectification",
    content: `Electronic health data access services referred to in Article 4 shall enable natural persons to easily request online the rectification of their personal electronic health data in accordance with Article 16 of Regulation (EU) 2016/679. Where appropriate, the controller shall verify with a relevant health professional the accuracy of the information provided in the request.

Member States may also enable natural persons to exercise online other rights pursuant to Chapter III of Regulation (EU) 2016/679 through electronic health data access services.`,
    relatedRecitals: [13],
    crossReferences: [4],
  },
  {
    id: 7,
    title: "Right to data portability for natural persons",
    content: `1. Natural persons shall have the right to give access to, or to request a healthcare provider to transmit, all or part of their personal electronic health data to another healthcare provider of their choice immediately, free of charge and without hindrance from the healthcare provider or from the manufacturers of the systems used by that healthcare provider.

2. Natural persons shall have the right, where the healthcare providers are located in different Member States, to request the transmission of their personal electronic health data in the European electronic health record exchange format referred to in Article 15 through the cross-border infrastructure referred to in Article 23. The receiving healthcare provider shall accept such data and shall be able to read them.

3. Natural persons shall have the right to request a healthcare provider to transmit a part of their personal electronic health data to a clearly identified recipient in the social security or reimbursement services sector. Such transmission shall be carried out immediately, free of charge and without hindrance from the healthcare provider or from the manufacturers of the systems used by that healthcare provider, and shall be one-way only.

4. Where natural persons have downloaded an electronic copy of their priority categories of personal electronic health data in accordance with Article 3(2), they shall be able to transmit those data to healthcare providers of their choice in the European electronic health record exchange format referred to in Article 15. The receiving healthcare provider shall accept such data and be able to read them, as applicable.`,
    relatedRecitals: [14, 15],
    crossReferences: [3, 15, 23],
  },
  {
    id: 8,
    title: "Right to restrict access",
    content: `Natural persons shall have the right to restrict the access of health professionals and healthcare providers to all or parts of their personal electronic health data as referred to in Article 3.

When exercising the right referred to in the first paragraph, natural persons shall be made aware that restricting access might impact the provision of healthcare to them.

The fact that a natural person has restricted access under the first paragraph shall not be visible to healthcare providers.

Member States shall establish the rules and specific safeguards regarding such restriction mechanisms.`,
    relatedRecitals: [17],
    crossReferences: [3],
  },
  {
    id: 9,
    title: "Right to obtain information on accessing data",
    content: `1. Natural persons shall have the right to obtain information, including through automatic notifications, on any access to their personal electronic health data through the health professional access service obtained in the context of healthcare, including access provided in accordance with Article 11(5).

2. The information referred to in paragraph 1 shall be provided, free of charge and without delay, through electronic health data access services and shall be available for at least three years from each date of access to the data. That information shall include at least the following:
(a) information on the healthcare provider or other individuals who accessed the personal electronic health data;
(b) the date and time of access;
(c) which personal electronic health data were accessed.

3. Member States may provide for restrictions to the right referred to in paragraph 1 in exceptional circumstances, where there are factual indications that disclosure would endanger the vital interests or rights of the health professional or the care of the natural person.`,
    relatedRecitals: [16],
    crossReferences: [11],
  },
  {
    id: 10,
    title: "Right of natural persons to opt out in primary use",
    content: `1. Member States' laws may provide that natural persons have the right to opt out from the access to their personal electronic health data registered in an EHR system through the electronic health data access services referred to in Articles 4 and 12. In such cases, Member States shall ensure that the exercise of that right is reversible.

2. If a Member State provides for a right referred to in paragraph 1 of this Article, it shall establish the rules and specific safeguards regarding the opt-out mechanism. In particular, Member States may provide for a healthcare provider or health professional to be able to get access to the personal electronic health data in cases where processing is necessary in order to protect the vital interests of the data subject or of another natural person as referred to in Article 9(2), point (c), of Regulation (EU) 2016/679, even if the patient has exercised the right to opt out in primary use.`,
    relatedRecitals: [18],
    crossReferences: [4, 12],
  },
  {
    id: 11,
    title: "Access by health professionals to personal electronic health data",
    content: `1. Where health professionals process data in an electronic format, they shall have access to the relevant and necessary personal electronic health data of natural persons under their treatment through the health professional access services referred to in Article 12, irrespective of the Member State of affiliation and the Member State of treatment.

2. The access referred to in paragraph 1 shall include at least the priority categories of personal electronic health data referred to in Article 14. The Member States may, in accordance with national law, allow access to additional categories of personal electronic health data through the health professional access services.

3. In the case of emergency care, access to personal electronic health data referred to in paragraph 1 shall be available to health professionals irrespective of any restrictions placed by the natural person pursuant to Article 8, unless the natural person or, where applicable, his or her representative, has exercised the right to opt out pursuant to Article 10.

4. The health professional access service shall provide information on the natural person's medication based on electronic prescriptions issued in accordance with Article 13.

5. Access to personal electronic health data pursuant to this Article shall be logged in accordance with Article 12(4).`,
    relatedRecitals: [19, 20],
    crossReferences: [8, 10, 12, 13, 14],
  },
  {
    id: 12,
    title: "Health professional access services",
    content: `1. Member States shall ensure the establishment of health professional access services, thereby enabling health professionals to access personal electronic health data as referred to in Article 11 and in accordance with their rights under national law. Those services shall be provided free of charge to healthcare providers.

2. Member States shall ensure that health professionals are able to uniquely identify themselves and authenticate their professional status in the health professional access services, taking into account the legal framework established by Regulation (EU) No 910/2014.

3. Member States shall ensure that health professionals can only access personal electronic health data in connection with the actual care of their patients, and in accordance with the specific rights and limitations determined by national law.

4. The health professional access services shall keep logs of access to personal electronic health data for the purposes referred to in Article 9. The logs shall be retained for at least three years.

5. The health professional access services shall be able to exchange personal electronic health data with the national contact point for digital health for cross-border healthcare.`,
    relatedRecitals: [19, 20],
    crossReferences: [9, 11],
  },
  {
    id: 13,
    title: "Electronic prescriptions and electronic dispensations",
    content: `1. Member States shall ensure that electronic prescriptions are issued in accordance with the European electronic health record exchange format referred to in Article 15 and that they can be exchanged cross-border in accordance with Article 23.

2. Member States shall ensure that pharmacies are able to dispense medicinal products and medical devices on the basis of electronic prescriptions issued in other Member States, in accordance with Directive 2011/24/EU.

3. Member States shall ensure that information on electronic dispensations is communicated to the healthcare provider that issued the electronic prescription.`,
    relatedRecitals: [21],
    crossReferences: [15, 23],
  },
  {
    id: 14,
    title: "Priority categories of personal electronic health data for primary use",
    content: `1. For the purposes of the primary use, the priority categories of personal electronic health data shall be:
(a) patient summaries;
(b) electronic prescriptions;
(c) electronic dispensations;
(d) medical images and image reports;
(e) laboratory results;
(f) hospital discharge reports.

Member States may, in accordance with Union and national law, identify additional categories of personal electronic health data that shall be accessed and exchanged for the purposes of primary use, taking into account the degree of maturity and state of implementation in the Member States.

The Commission shall adopt delegated acts in accordance with Article 96 to amend the list of priority categories referred to in the first subparagraph, taking into account the state of implementation and technological developments.

2. Member States shall ensure that personal electronic health data belonging to the priority categories of personal electronic health data referred to in paragraph 1 are registered in an electronic format, in accordance with Article 15, from the dates specified in this Regulation.`,
    relatedRecitals: [22, 23],
    crossReferences: [3, 11, 15, 96],
  },
  {
    id: 15,
    title: "European electronic health record exchange format",
    content: `1. The Commission shall, by means of implementing acts, set out the technical specifications for the European electronic health record exchange format for each of the priority categories of personal electronic health data referred to in Article 14(1). Those implementing acts shall be adopted in accordance with the examination procedure referred to in Article 98(2).

2. The technical specifications referred to in paragraph 1 shall set out the structure and format of the data, including the use of coding systems and vocabularies, and shall be based on the technical specifications developed by the eHealth Network and applicable international and European standards.

3. The European electronic health record exchange format shall enable the registration and exchange of personal electronic health data with a sufficient degree of quality and interoperability for the purposes of primary use.`,
    relatedRecitals: [24, 25],
    crossReferences: [3, 7, 13, 14, 98],
  },
  {
    id: 16,
    title: "Obligations of healthcare providers regarding electronic health data",
    content: `1. Healthcare providers shall register in an electronic format the relevant personal electronic health data belonging to the priority categories referred to in Article 14 from their clinical processes.

2. Healthcare providers shall ensure that personal electronic health data that they register, including data received from other healthcare providers, are made available to the natural persons concerned in accordance with Article 3 and to health professionals in accordance with Article 11.

3. Healthcare providers shall make available to the national contact point for digital health personal electronic health data in the European electronic health record exchange format referred to in Article 15 for the purposes of cross-border healthcare.`,
    relatedRecitals: [26],
    crossReferences: [3, 11, 14, 15],
  },
  {
    id: 17,
    title: "Requirements for technical implementation",
    content: `The Commission shall, by means of implementing acts, determine the requirements for the technical implementation of the rights set out in this Section. Those implementing acts shall be adopted in accordance with the examination procedure referred to in Article 98(2).`,
    relatedRecitals: [],
    crossReferences: [98],
  },
  {
    id: 18,
    title: "Compensation for making personal electronic health data available",
    content: `Providers receiving data under this Chapter shall not be required to compensate the healthcare provider for making personal electronic health data available. A healthcare provider or a third party shall not directly or indirectly charge data subjects a fee or costs, or require compensation, for sharing or accessing data.`,
    relatedRecitals: [],
    crossReferences: [],
  },
  {
    id: 19,
    title: "Digital health authorities",
    content: `1. Each Member State shall designate one or more digital health authorities responsible for the implementation and enforcement of this Chapter at national level. The Member States shall inform the Commission of the identity of the digital health authorities by 26 March 2027. Where a Member State designates more than one digital health authority, the Member State concerned shall communicate to the Commission a description of the distribution of tasks between those various authorities. Where a Member State designates several digital health authorities, it shall designate one digital health authority to act as coordinator. The Commission shall make that information publicly available.

2. Each digital health authority shall be entrusted with the following tasks and powers:
(a) ensuring the implementation of the rights and obligations provided for in this Chapter and Chapter III;
(b) ensuring that complete and up-to-date information about the implementation of rights and obligations is made readily available to natural persons, health professionals and healthcare providers;
(c) ensuring that technical solutions comply with this Chapter, Chapter III and Annex II;
(d) contributing at Union level to the development of technical solutions;
(e) facilitating persons with disabilities to exercise their rights;
(f) supervising the national contact points for digital health and cooperating with other digital health authorities;
(g) ensuring the implementation at national level of the European electronic health record exchange format;
(h) contributing at Union level to the development of the European electronic health record exchange format;
(i) performing market surveillance activities in accordance with Article 43;
(j) building national capacity for implementing requirements concerning interoperability and security;
(k) cooperating with market surveillance authorities;
(l) cooperating with other relevant entities and bodies;
(m) cooperating with supervisory authorities in accordance with Regulations (EU) No 910/2014 and (EU) 2016/679.

3. Each Member State shall ensure that each digital health authority is provided with the human, technical and financial resources necessary for the effective performance of its tasks.

4. In the performance of its tasks, each digital health authority shall avoid any conflicts of interest.

5. In the performance of their tasks, the relevant digital health authorities shall actively cooperate and consult with relevant stakeholders' representatives.`,
    relatedRecitals: [27, 28],
    crossReferences: [43],
  },
  {
    id: 20,
    title: "Reporting by digital health authorities",
    content: `Digital health authorities designated pursuant to Article 19 shall publish an activity report every two years, which shall contain a comprehensive overview of their activities. That activity report shall follow a structure agreed at Union level within the European Health Data Space Board (the 'EHDS Board') referred to in Article 92. That activity report shall contain at least information concerning:
(a) the measures taken to implement this Regulation;
(b) the percentage of natural persons having access to the various data categories of their electronic health records;
(c) the handling of requests from natural persons regarding the exercise of their rights;
(d) the number of healthcare providers connected to MyHealth@EU;
(e) the volumes of electronic health data shared across borders through MyHealth@EU;
(f) the number of cases of non-compliance with mandatory requirements.`,
    relatedRecitals: [],
    crossReferences: [19, 92],
  },
  {
    id: 21,
    title: "Right to lodge a complaint with a digital health authority",
    content: `1. Without prejudice to any other administrative or judicial remedy, natural and legal persons shall have the right to lodge a complaint in relation to the provisions laid down in this Chapter, individually or, where relevant, collectively, with the competent digital health authority, provided that their rights or interests are negatively affected.

2. Where the complaint concerns the rights of natural persons pursuant to Articles 3 and 5 to 10 of this Regulation, the digital health authority shall transmit the complaint to the competent supervisory authorities under Regulation (EU) 2016/679.

3. The competent digital health authority with which the complaint has been lodged shall inform the complainant of the progress made in dealing with the complaint, of the decision taken on the complaint, and of any referral to the competent supervisory authority.

4. Digital health authorities in the Member States concerned shall cooperate to handle and resolve complaints related to cross-border exchange of and access to personal electronic health data, without undue delay.

5. Digital health authorities shall facilitate the submission of complaints and provide easily accessible tools for the submission of complaints.`,
    relatedRecitals: [],
    crossReferences: [3, 5, 6, 7, 8, 9, 10],
  },
  {
    id: 22,
    title: "Relationship with supervisory authorities under Regulation (EU) 2016/679",
    content: `The supervisory authority or supervisory authorities responsible for monitoring and enforcing the application of Regulation (EU) 2016/679 shall also be competent for monitoring and enforcing the application of Articles 3 and 5 to 10 of this Regulation. The relevant provisions of Regulation (EU) 2016/679 shall apply mutatis mutandis. Supervisory authorities shall be empowered to impose administrative fines up to the amount referred to in Article 83(5) of Regulation (EU) 2016/679.

The supervisory authorities referred to in the first paragraph of this Article and digital health authorities referred to in Article 19 shall, where relevant, cooperate in the enforcement of this Regulation, within the remit of their respective competences.`,
    relatedRecitals: [],
    crossReferences: [3, 5, 6, 7, 8, 9, 10, 19],
  },
  {
    id: 23,
    title: "MyHealth@EU",
    content: `1. The Commission shall establish a central interoperability platform for digital health ('MyHealth@EU') to provide services to support and facilitate the exchange of personal electronic health data between the national contact points for digital health of the Member States.

2. Each Member State shall designate one national contact point for digital health, as an organisational and technical gateway for the provision of services linked to the cross-border exchange of personal electronic health data in the context of primary use. Each national contact point for digital health shall be connected to all other national contact points for digital health in other Member States and to the central interoperability platform for digital health in the cross-border infrastructure MyHealth@EU. Each Member State shall inform the Commission of the identity of its national contact point for digital health by 26 March 2027.

3. Each national contact point for digital health shall enable the exchange of the personal electronic health data referred to in Article 14(1) with national contact points for digital health in other Member States through MyHealth@EU. That exchange shall be based on the European electronic health record exchange format.

4. By 26 March 2027, the Commission shall, by means of implementing acts, adopt the necessary measures for the technical development of MyHealth@EU, detailed rules concerning the security, confidentiality and protection of personal electronic health data and the conditions for compliance checks necessary to join and remain connected to MyHealth@EU.

5. Member States shall ensure the connection of all healthcare providers to their national contact points for digital health.

6. Member States shall ensure that pharmacies operating on their territories are able to dispense electronic prescriptions issued in other Member States.

7. The national contact points for digital health shall act as joint controllers of the personal electronic health data communicated through MyHealth@EU for the processing operations in which they are involved. The Commission shall act as processor.

8. The Commission shall, by means of implementing acts, lay down the rules regarding the requirements of cybersecurity, technical interoperability, semantic interoperability, operations and service management.

9. The national contact points for digital health shall fulfil the conditions to join and to remain connected to MyHealth@EU as laid down in the implementing acts.`,
    relatedRecitals: [29, 30, 31],
    crossReferences: [7, 13, 14, 98],
  },
  {
    id: 24,
    title: "Supplementary cross-border digital health services and infrastructures",
    content: `1. Member States may provide through MyHealth@EU supplementary services that facilitate telemedicine, mobile health, access by natural persons to existing translations of their health data, exchange or verification of health-related certificates, including vaccination card services supporting public health and public health monitoring or digital health systems, services and interoperable applications, with a view to achieving a high level of trust and security, enhancing continuity of care and ensuring access to safe and high-quality healthcare. The Commission shall, by means of implementing acts, set out the technical aspects of such supplementary services.

2. The Commission and Member States may facilitate the exchange of personal electronic health data with other infrastructures, such as the Clinical Patient Management System or other services or infrastructures in the health, care or social security fields which may become authorised participants in MyHealth@EU. The Commission shall, by means of implementing acts, set out the technical aspects of such exchanges.

The connection and disconnection of another infrastructure to or from the central platform for digital health shall be subject to a decision of the Commission adopted by means of an implementing act, based on the result of compliance checks.`,
    relatedRecitals: [],
    crossReferences: [98],
  },
  {
    id: 25,
    title: "Third country access to MyHealth@EU",
    content: `1. A third country may request the Commission to connect a contact point of that third country to MyHealth@EU, provided that:
(a) the third country has a national infrastructure for exchanging personal electronic health data;
(b) natural persons from Member States could benefit from such connection when in that third country;
(c) an agreement or arrangement with the Union covers aspects of data protection and cybersecurity;
(d) the third country complies with the applicable technical requirements.

2. Following a request pursuant to paragraph 1, the Commission shall assess whether the conditions are fulfilled. Following a positive assessment, the Commission shall, by means of an implementing act, decide on the connection of the contact point of that third country to MyHealth@EU.

3. The Commission shall be empowered to adopt implementing acts suspending or terminating the connection if the conditions referred to in paragraph 1 cease to be fulfilled.`,
    relatedRecitals: [],
    crossReferences: [],
  },
  {
    id: 26,
    title: "Cooperation between digital health authorities",
    content: `Digital health authorities shall cooperate in performing their tasks, in particular by:
(a) facilitating the implementation of this Regulation;
(b) providing mutual assistance, including by exchanging information;
(c) carrying out capacity building to exchange best practices;
(d) providing technical support and guidance on the implementation of technical standards.`,
    relatedRecitals: [],
    crossReferences: [],
  },
  {
    id: 27,
    title: "Scope of Chapter III",
    content: `1. This Chapter applies to EHR systems intended by the manufacturer to be placed on the market in the Union or put into service and used in the Union.

2. Where an EHR system constitutes also a medical device within the meaning of Regulation (EU) 2017/745 or an in vitro diagnostic medical device within the meaning of Regulation (EU) 2017/746, the requirements set out in this Chapter shall apply in addition to the requirements in those Regulations, unless otherwise provided.

3. Where an EHR system includes components that constitute high-risk AI systems within the meaning of Regulation (EU) 2024/1689, the requirements set out in this Chapter shall apply in addition to the requirements in that Regulation, unless otherwise provided.`,
    relatedRecitals: [32, 33],
    crossReferences: [],
  },
  {
    id: 28,
    title: "Essential requirements for EHR systems",
    content: `1. EHR systems placed on the market or put into service shall meet the essential requirements laid down in Annex II. The essential requirements shall be interpreted and implemented taking into account the intended purpose of the EHR system.

2. Manufacturers shall ensure that their EHR systems meet the essential requirements laid down in Annex II throughout their lifetime, including after any software update.

3. The essential requirements laid down in Section 1 of Annex II shall apply to components designed to store or intermediate personal electronic health data belonging to the priority categories referred to in Article 14.

4. The essential requirements laid down in Sections 2 and 3 of Annex II shall apply to the European interoperability software component and European logging software component of the EHR systems.`,
    relatedRecitals: [34, 35],
    crossReferences: [14],
  },
  {
    id: 29,
    title: "Placing on the market and putting into service",
    content: `1. EHR systems shall be placed on the market or put into service only if they comply with the provisions of this Chapter.

2. EHR systems that are manufactured and used within health institutions established in the Union shall be considered as having been put into service.

3. EHR systems that are modified after their placing on the market or putting into service in such a way that their compliance with the applicable essential requirements may be affected shall be considered as a new EHR system and shall be subject to a new conformity assessment.`,
    relatedRecitals: [36],
    crossReferences: [28],
  },
  {
    id: 30,
    title: "Claims",
    content: `In the labelling, instructions for use and any promotional materials, it shall be prohibited to use text, names, trademarks, images or other signs that could mislead the user regarding the EHR system's intended purpose, interoperability or security by:

(a) ascribing functions and properties to the EHR system which it does not have;

(b) failing to inform the user of limitations or possible risks associated with the use of the EHR system;

(c) suggesting uses of the EHR system other than those stated in the technical documentation.`,
    relatedRecitals: [],
    crossReferences: [],
  },
  {
    id: 31,
    title: "Common specifications",
    content: `1. The Commission shall adopt, by means of implementing acts, common specifications in respect of the essential requirements laid down in Annex II, including a time limit by which manufacturers shall apply those common specifications.

2. Common specifications referred to in paragraph 1 shall cover, where relevant:
(a) the European electronic health record exchange format;
(b) specifications related to the dataset categories for the exchange of electronic health data;
(c) technical specifications concerning security;
(d) specifications to ensure the correct identification of patients and health professionals;
(e) specifications for a European logging mechanism.

3. Those implementing acts shall be adopted in accordance with the examination procedure referred to in Article 98(2).`,
    relatedRecitals: [37],
    crossReferences: [98],
  },
  {
    id: 32,
    title: "EU declaration of conformity",
    content: `1. The EU declaration of conformity shall state that the EHR system complies with the applicable essential requirements laid down in Annex II and common specifications referred to in Article 31.

2. The EU declaration of conformity shall contain the information set out in Annex IV and shall be translated into the language or languages required by the Member State in which the EHR system is placed on the market or made available.

3. By drawing up the EU declaration of conformity, the manufacturer shall assume responsibility for the compliance of the EHR system.

4. Where EHR systems are subject to other Union legislation which also requires an EU declaration of conformity by the manufacturer, a single EU declaration of conformity shall be drawn up.`,
    relatedRecitals: [38],
    crossReferences: [31],
  },
  {
    id: 33,
    title: "CE marking of conformity",
    content: `1. The CE marking shall be affixed visibly, legibly and indelibly to the EHR system or to the accompanying documents. Where the EHR system is delivered in electronic form, the CE marking shall be displayed on the website of the manufacturer.

2. The CE marking shall be affixed before the EHR system is placed on the market. The CE marking shall be followed by the identification number of the notified body responsible for the conformity assessment procedure set out in Article 36, where applicable.

3. The CE marking shall be subject to the general principles set out in Article 30 of Regulation (EC) No 765/2008.`,
    relatedRecitals: [],
    crossReferences: [36],
  },
  {
    id: 34,
    title: "Technical documentation",
    content: `1. Manufacturers shall draw up technical documentation before the EHR system is placed on the market or put into service and shall keep such documentation up to date.

2. The technical documentation shall demonstrate that the EHR system complies with the essential requirements laid down in Annex II. It shall contain at least the elements set out in Annex III.

3. The technical documentation shall be drawn up in one of the official languages of the Union. The competent national authority of a Member State may request a translation of the relevant parts of the technical documentation into the official language of that Member State.

4. Manufacturers shall keep the technical documentation for a period of at least 10 years after the EHR system has been placed on the market.`,
    relatedRecitals: [],
    crossReferences: [],
  },
  {
    id: 35,
    title: "Conformity assessment of EHR systems",
    content: `1. Manufacturers shall carry out a conformity assessment of the EHR system before placing it on the market or putting it into service in order to demonstrate conformity with the essential requirements laid down in Annex II.

2. Where conformity of the EHR system with the applicable essential requirements has been demonstrated following the conformity assessment referred to in paragraph 1, the manufacturer shall draw up an EU declaration of conformity and affix the CE marking.

3. Manufacturers may choose between the following conformity assessment procedures:
(a) internal control procedure as set out in Annex V;
(b) conformity assessment based on quality management system as set out in Annex VI.

4. EHR systems that have been certified or for which a statement of conformity has been issued under a cybersecurity certification scheme pursuant to Regulation (EU) 2019/881 shall be presumed to be in conformity with the cybersecurity requirements set out in Annex II to the extent that those requirements are covered by the cybersecurity certificate or statement of conformity.`,
    relatedRecitals: [39, 40],
    crossReferences: [],
  },
  {
    id: 36,
    title: "Notified bodies",
    content: `1. Member States shall designate conformity assessment bodies as notified bodies in accordance with Article 37 to carry out third-party conformity assessment activities pursuant to Article 35.

2. Notified bodies shall be notified to the Commission in accordance with Regulation (EU) 2019/1020.

3. Notified bodies shall comply with the requirements set out in Annex VII.

4. The Commission shall make publicly available, by electronic means, the list of notified bodies and the relevant information regarding their competences.`,
    relatedRecitals: [],
    crossReferences: [35, 37],
  },
  {
    id: 37,
    title: "Requirements relating to notified bodies",
    content: `1. A notified body shall be established under national law and have legal personality.

2. A notified body shall be a third-party body independent of the organisation or the EHR system it assesses.

3. A notified body shall be organised and operated so as to safeguard the independence, objectivity and impartiality of its activities.

4. A notified body shall be organised in such a way that each decision relating to certification is taken by persons different from those who carried out the assessment.

5. Notified bodies shall take out appropriate liability insurance for their conformity assessment activities.

6. Notified bodies shall have documented procedures in place to ensure that conformity assessment is carried out with due account of the size of undertakings, the sector in which they operate, their structure, the degree of complexity of the EHR system in question and the volume of production.`,
    relatedRecitals: [],
    crossReferences: [36],
  },
  {
    id: 38,
    title: "Obligations of manufacturers of EHR systems",
    content: `1. Manufacturers of EHR systems shall:
(a) ensure that their EHR systems comply with the essential requirements laid down in Annex II;
(b) draw up the technical documentation referred to in Article 34;
(c) ensure that the conformity assessment procedure referred to in Article 35 is carried out;
(d) draw up the EU declaration of conformity referred to in Article 32;
(e) affix the CE marking referred to in Article 33;
(f) indicate their name, registered trade name or registered trade mark, and address on the EHR system or accompanying documents;
(g) have procedures in place to ensure that series production remains in conformity;
(h) ensure that the EHR system is accompanied by the instructions for use and information set out in Annex II;
(i) take corrective measures if the EHR system is not in conformity.

2. Manufacturers shall keep the EU declaration of conformity and technical documentation for at least 10 years.`,
    relatedRecitals: [41],
    crossReferences: [32, 33, 34, 35],
  },
  {
    id: 39,
    title: "Authorised representatives",
    content: `1. Where the manufacturer is not established in the Union, an EHR system may only be placed on the market or put into service if the manufacturer designates, by written mandate, an authorised representative established in the Union.

2. The authorised representative shall perform the tasks specified in the mandate agreed with the manufacturer. The mandate shall allow the authorised representative to carry out at least the following tasks:
(a) keep the EU declaration of conformity and technical documentation at the disposal of national competent authorities;
(b) provide the competent authority with all information necessary to demonstrate the conformity of the EHR system;
(c) cooperate with the competent authorities on any corrective or preventive action.`,
    relatedRecitals: [],
    crossReferences: [],
  },
  {
    id: 40,
    title: "Obligations of importers",
    content: `1. Importers shall only place on the market EHR systems that comply with the requirements of this Regulation.

2. Before placing an EHR system on the market, importers shall ensure that:
(a) the appropriate conformity assessment procedure has been carried out by the manufacturer;
(b) the manufacturer has drawn up the technical documentation;
(c) the EHR system bears the CE marking;
(d) the EHR system is accompanied by the required information and instructions for use.

3. Importers shall indicate their name, registered trade name or registered trade mark, and address on the EHR system or on its packaging or in a document accompanying it.

4. Importers shall keep a copy of the EU declaration of conformity and ensure that the technical documentation can be made available to competent authorities for at least 10 years.`,
    relatedRecitals: [],
    crossReferences: [],
  },
  {
    id: 41,
    title: "Obligations of distributors",
    content: `1. Before making an EHR system available on the market, distributors shall verify that:
(a) the EHR system bears the CE marking;
(b) it is accompanied by the required information and instructions for use;
(c) the manufacturer and the importer have complied with the requirements set out in Articles 38 and 40.

2. Where a distributor considers or has reason to believe that an EHR system is not in conformity with the requirements laid down in Annex II, the distributor shall not make the EHR system available on the market until it has been brought into conformity.

3. Distributors shall inform the relevant digital health authority and the manufacturer or importer if they consider or have reason to believe that an EHR system presents a risk.`,
    relatedRecitals: [],
    crossReferences: [38, 40],
  },
  {
    id: 42,
    title: "Cases in which obligations of manufacturers apply to other economic operators",
    content: `An importer, distributor or user that places an EHR system on the market under its own name or trade mark, or modifies an EHR system already placed on the market in such a way that compliance with the applicable requirements may be affected, shall be considered a manufacturer for the purposes of this Regulation and shall be subject to the obligations of manufacturers set out in Article 38.`,
    relatedRecitals: [],
    crossReferences: [38],
  },
  {
    id: 43,
    title: "Market surveillance",
    content: `1. Regulation (EU) 2019/1020 shall apply to EHR systems covered by this Chapter.

2. Digital health authorities designated pursuant to Article 19 shall be responsible for market surveillance activities for EHR systems.

3. Digital health authorities shall ensure that economic operators comply with the obligations laid down in this Chapter and shall take appropriate measures where necessary.

4. Digital health authorities shall have the power to:
(a) require economic operators to provide all information necessary to verify compliance;
(b) carry out unannounced on-site inspections and physical checks of EHR systems;
(c) take samples of EHR systems for testing;
(d) request notified bodies to provide information on certificates issued, modified, suspended, withdrawn or refused.

5. Member States shall ensure that digital health authorities have adequate resources, including sufficient budgetary and human resources.`,
    relatedRecitals: [42],
    crossReferences: [19],
  },
  {
    id: 44,
    title: "Handling complaints",
    content: `1. Manufacturers of EHR systems shall have procedures in place to handle complaints and to keep a register of complaints.

2. If a complaint or user report concerns a risk related to an EHR system, the manufacturer shall immediately analyse the complaint and record the results of the analysis.

3. Manufacturers shall inform the competent digital health authority of any complaint or report concerning a serious incident related to an EHR system.`,
    relatedRecitals: [],
    crossReferences: [],
  },
  {
    id: 45,
    title: "EU database on EHR systems",
    content: `1. The Commission shall establish an EU database on EHR systems to register EHR systems placed on the market or put into service in the Union.

2. The database shall contain at least the following information:
(a) the name and address of the manufacturer and, where applicable, its authorised representative;
(b) the name of the EHR system;
(c) the EU declaration of conformity;
(d) the date on which the EHR system was placed on the market or put into service.

3. Manufacturers shall submit the information referred to in paragraph 2 before placing their EHR system on the market.

4. The Commission shall establish the technical requirements and specifications for the database by means of implementing acts.`,
    relatedRecitals: [43],
    crossReferences: [98],
  },
  {
    id: 46,
    title: "Registration of EHR systems",
    content: `1. Manufacturers shall register EHR systems in the EU database referred to in Article 45 before placing them on the market or putting them into service.

2. Manufacturers shall register any significant change to the EHR system that may affect its compliance with the essential requirements.

3. Manufacturers shall indicate in the registration whether the EHR system also falls within the scope of Regulation (EU) 2017/745, Regulation (EU) 2017/746 or Regulation (EU) 2024/1689.`,
    relatedRecitals: [],
    crossReferences: [45],
  },
  {
    id: 47,
    title: "Labelling requirements for wellness applications",
    content: `1. Manufacturers of wellness applications that claim interoperability with EHR systems and that are not subject to Chapter III shall declare such interoperability with the European electronic health record exchange format and provide evidence.

2. Where a wellness application claims to enable the exchange of data with EHR systems, users shall be informed in a clear and comprehensible manner about:
(a) the categories of personal electronic health data that can be exchanged;
(b) the formats supported;
(c) any limitations to the exchange.

3. The Commission may, by means of implementing acts, set out the format and content of the declaration referred to in paragraph 1.`,
    relatedRecitals: [44],
    crossReferences: [],
  },
  {
    id: 48,
    title: "Voluntary labelling of wellness applications",
    content: `1. Where the manufacturer of a wellness application claims compliance with the interoperability requirements, this claim shall be verified by a self-assessment procedure.

2. Wellness applications that claim compliance shall be registered in the EU database referred to in Article 45.

3. The Commission shall, by means of implementing acts, set out the requirements for the self-assessment procedure and the registration in the database.`,
    relatedRecitals: [],
    crossReferences: [45],
  },
  {
    id: 49,
    title: "Market surveillance of wellness applications",
    content: `1. Digital health authorities shall monitor compliance of wellness applications with the requirements laid down in Articles 47 and 48.

2. Where the digital health authority finds that a wellness application does not comply with the requirements, it shall require the manufacturer to take corrective measures.

3. If the manufacturer fails to take adequate corrective measures, the digital health authority shall take all appropriate measures to restrict, prohibit or withdraw the wellness application from the market.`,
    relatedRecitals: [],
    crossReferences: [47, 48],
  },
  {
    id: 50,
    title: "Transitional provisions for EHR systems",
    content: `1. EHR systems that have been placed on the market or put into service before 26 March 2029 may continue to be placed on the market and remain in service without complying with Chapter III, provided that no significant changes are made to them.

2. Manufacturers of EHR systems placed on the market or put into service before 26 March 2029 shall ensure compliance with Chapter III from that date for any significant change to those systems.

3. EHR systems constituting medical devices, in vitro diagnostic medical devices or AI systems shall comply with the applicable provisions of this Regulation by 26 March 2029.`,
    relatedRecitals: [45],
    crossReferences: [],
  },
  {
    id: 51,
    title: "Purpose and scope of Chapter IV",
    content: `1. This Chapter lays down rules for the secondary use of electronic health data for the purposes referred to in Article 53.

2. This Chapter applies to:
(a) health data holders;
(b) health data users;
(c) health data access bodies;
(d) data intermediaries, as referred to in Regulation (EU) 2022/868, processing electronic health data;
(e) manufacturers and suppliers of products and services for secondary use of electronic health data.

3. This Chapter shall be without prejudice to Regulations (EU) 2016/679 and (EU) 2018/1725, Directive 2002/58/EC and Directive (EU) 2016/943.`,
    relatedRecitals: [53, 54],
    crossReferences: [53],
  },
  {
    id: 52,
    title: "Minimum categories of electronic health data for secondary use",
    content: `1. Health data holders shall make the following categories of electronic health data available for secondary use in accordance with the provisions of this Chapter:
(a) electronic health data from electronic health records;
(b) data from registries concerning specific diseases, medical conditions or exposures;
(c) electronic health data from biobanks and associated databases;
(d) electronic health data from health-related surveys and questionnaires;
(e) electronic health data from clinical trials;
(f) data from medical devices and related wellness applications;
(g) electronic health data from administrative claims and reimbursement databases;
(h) electronic health data from genetic and genomic databases;
(i) electronic health data from public health registries;
(j) electronic health data from mortality registries;
(k) electronic health data from environmental, occupational, building, lifestyle and behavioural factors relating to health.

2. The obligation set out in paragraph 1 shall not affect intellectual property rights, trade secrets, or confidentiality of commercially sensitive information.

3. The Commission may adopt delegated acts to amend the list of categories set out in paragraph 1.`,
    relatedRecitals: [55, 56, 57],
    crossReferences: [96],
  },
  {
    id: 53,
    title: "Permitted purposes for secondary use",
    content: `1. Health data access bodies shall grant access to electronic health data for secondary use only where the intended purpose of the processing by the health data user falls within one or more of the following:
(a) activities for reasons of public interest in the area of public health, including protection against serious cross-border threats to health, public health surveillance, and scientific research in the public interest;
(b) supporting activities of public sector bodies and Union institutions, bodies, offices and agencies to carry out their tasks in the health or care sectors;
(c) producing national and Union official statistics;
(d) education or teaching activities in the health or care sectors;
(e) scientific research relating to the health or care sectors;
(f) development and innovation activities for products or services contributing to public health or social security;
(g) training, testing and evaluating of AI systems in health or care applications;
(h) personalised medicine aimed at assessing possible treatment options for a natural person;
(i) regulatory purposes, including market and post-market surveillance of medicinal products and medical devices.

2. Access to electronic health data shall be refused for the following purposes:
(a) taking decisions detrimental to a natural person based on their electronic health data;
(b) taking decisions in relation to a natural person or a group of natural persons regarding insurance products or services;
(c) advertising or commercial purposes;
(d) providing access to third parties not mentioned in the data permit;
(e) developing products or services that may harm individuals or societies.`,
    relatedRecitals: [58, 59, 60, 61],
    crossReferences: [],
  },
  {
    id: 54,
    title: "Obligations of health data holders",
    content: `1. Health data holders shall make the categories of electronic health data referred to in Article 52 available to health data access bodies for secondary use.

2. Health data holders shall make the electronic health data available to health data access bodies within three months of receipt of a request from a health data access body.

3. Health data holders shall provide the health data access body with a description of the datasets they hold, including the type and sources of data, the data quality, and any restrictions on the re-use of the data.

4. Health data holders shall provide the health data access body with the electronic health data in an interoperable format, in accordance with the technical specifications adopted by the Commission.

5. Health data holders shall not withhold data or request excessive fees in order to discourage applications for access to electronic health data.`,
    relatedRecitals: [62],
    crossReferences: [52],
  },
  {
    id: 55,
    title: "Data quality and utility",
    content: `1. Health data access bodies shall assess the quality and utility of datasets made available by health data holders and shall assign a data quality and utility label to each dataset.

2. The data quality and utility label shall indicate the level of completeness, accuracy, validity and timeliness of the data.

3. The Commission shall, by means of delegated acts, establish the minimum elements of the data quality and utility label and the methodology for assessing data quality.

4. Health data access bodies shall make available to health data users the data quality and utility label together with the dataset description in the dataset catalogue.`,
    relatedRecitals: [63],
    crossReferences: [96],
  },
  {
    id: 56,
    title: "Dataset catalogue",
    content: `1. Each health data access body shall establish and maintain a national dataset catalogue containing descriptions of the datasets available for secondary use.

2. The dataset catalogue shall contain at least the following information:
(a) the name and contact details of the health data holder;
(b) the source and nature of the electronic health data;
(c) the conditions for making electronic health data available, including any restrictions;
(d) the data quality and utility label;
(e) information on the data format and standards used;
(f) information on the frequency of data updates.

3. National dataset catalogues shall be made publicly available online.

4. The Commission shall establish a Union-level dataset catalogue connecting the national dataset catalogues.`,
    relatedRecitals: [64],
    crossReferences: [],
  },
  {
    id: 57,
    title: "Right to opt out from secondary use",
    content: `1. Natural persons shall have the right to opt out from the secondary use of their personal electronic health data. Member States shall provide an easily accessible mechanism for exercising this right.

2. The opt-out shall be free of charge and shall not require the natural person to provide a reason.

3. Where a natural person exercises the right to opt out, the health data access body shall ensure that personal electronic health data relating to that natural person are not made available for secondary use.

4. The exercise of the right to opt out shall not affect the lawfulness of processing based on consent or any other lawful basis before the opt-out.

5. Member States may establish rules providing that in exceptional cases related to significant public health threats, the right to opt out may be limited.`,
    relatedRecitals: [62],
    crossReferences: [],
  },
  {
    id: 58,
    title: "Application for access to electronic health data",
    content: `1. Any natural or legal person may submit an application for access to electronic health data for secondary use to a health data access body.

2. The application shall include:
(a) the identity and contact details of the applicant;
(b) a detailed description of the purposes for which access is requested;
(c) a description of the electronic health data requested;
(d) a description of the tools and computing resources needed to process the data;
(e) a description of the security measures to be taken to protect the data;
(f) the period for which access is requested;
(g) any other information required by the health data access body.

3. Health data access bodies shall make available application forms to facilitate the submission of applications.`,
    relatedRecitals: [68],
    crossReferences: [],
  },
  {
    id: 59,
    title: "Assessment of applications",
    content: `1. Health data access bodies shall assess whether an application meets the requirements for granting access.

2. Health data access bodies shall verify that:
(a) the purposes fall within the permitted purposes referred to in Article 53;
(b) the data requested are necessary for the stated purposes;
(c) the applicant has the capacity to fulfil the conditions of the data permit;
(d) the processing is proportionate to the purposes pursued;
(e) adequate security measures are in place.

3. Health data access bodies shall issue a reasoned decision within three months of receipt of a complete application.

4. The decision shall be communicated to the applicant in writing.`,
    relatedRecitals: [69],
    crossReferences: [53],
  },
  {
    id: 60,
    title: "Data permit",
    content: `1. Where a health data access body decides to grant access to electronic health data, it shall issue a data permit to the health data user.

2. The data permit shall specify:
(a) the identity of the health data user;
(b) the purpose for which access is granted;
(c) the categories of electronic health data covered;
(d) the period of validity of the data permit;
(e) the applicable fees;
(f) any specific conditions or restrictions;
(g) the secure processing environment to be used;
(h) the prohibition on re-identification.

3. The data permit shall be valid for a maximum period of five years, renewable upon application.

4. Health data access bodies shall maintain a register of all data permits issued.`,
    relatedRecitals: [70],
    crossReferences: [],
  },
  {
    id: 61,
    title: "Health data request",
    content: `1. A health data user may submit a health data request to a health data access body for the provision of anonymised statistical data, without the need to access personal electronic health data directly.

2. The health data request shall specify:
(a) the purpose of the request;
(b) the data needed;
(c) the statistical analysis to be performed;
(d) the format in which the results should be provided.

3. Health data access bodies shall provide the anonymised statistical data within two months of receipt of a complete request.

4. Health data access bodies may refuse a health data request if compliance would require disproportionate effort or if there is a risk of re-identification.`,
    relatedRecitals: [71],
    crossReferences: [],
  },
  {
    id: 62,
    title: "Multi-country access",
    content: `1. Where a health data user seeks access to electronic health data located in more than one Member State, the health data user may submit a single application to a health data access body in any of those Member States.

2. The health data access body receiving the application shall coordinate with the health data access bodies in the other Member States concerned.

3. The health data access bodies involved shall take a joint decision on the application within six months.

4. Where a joint decision cannot be reached, the health data access body that received the application shall decide, taking into account the views expressed by the other health data access bodies.`,
    relatedRecitals: [72],
    crossReferences: [],
  },
  {
    id: 63,
    title: "Fees",
    content: `1. Health data access bodies and health data holders may charge fees for making electronic health data available for secondary use.

2. Fees shall be based on the costs related to the processing of applications, the preparation and provision of data, and the operation of secure processing environments.

3. Fees shall be transparent, non-discriminatory, and proportionate to the cost of the services provided.

4. Reduced fees or fee waivers may be granted for applications from public sector bodies, researchers and small and medium-sized enterprises.

5. The Commission shall, by means of delegated acts, establish guidelines on the structure and level of fees.`,
    relatedRecitals: [73],
    crossReferences: [96],
  },
  {
    id: 64,
    title: "Compensation for health data holders",
    content: `1. Health data holders may receive compensation for making electronic health data available to health data access bodies.

2. Compensation shall cover the costs directly attributable to making the data available, including data collection, storage, processing and transmission.

3. The Commission shall, by means of delegated acts, establish a methodology for calculating the compensation referred to in paragraph 1.`,
    relatedRecitals: [74],
    crossReferences: [96],
  },
  {
    id: 65,
    title: "Obligations of health data users",
    content: `1. Health data users shall:
(a) process electronic health data only for the purposes specified in the data permit;
(b) implement appropriate technical and organisational measures to ensure the security of the data;
(c) not attempt to re-identify any natural persons;
(d) not transfer the data to third parties not authorised in the data permit;
(e) notify the health data access body of any security incident;
(f) delete the electronic health data at the end of the period specified in the data permit;
(g) make public the results of the processing in an anonymised and aggregated form.

2. Health data users shall keep records of all processing operations carried out under the data permit.

3. Health data users shall cooperate with health data access bodies in the exercise of their supervisory powers.`,
    relatedRecitals: [75],
    crossReferences: [],
  },
  {
    id: 66,
    title: "Secure processing environment",
    content: `1. Health data access bodies shall establish secure processing environments in which health data users may access and process electronic health data.

2. Secure processing environments shall:
(a) provide a high level of security and confidentiality;
(b) ensure that only authorised health data users can access the data;
(c) prevent the extraction of personal electronic health data;
(d) keep logs of all data processing operations;
(e) provide computing resources appropriate for the processing activities;
(f) comply with recognised cybersecurity standards.

3. Health data access bodies shall carry out regular security assessments of their secure processing environments.

4. The Commission shall, by means of implementing acts, adopt minimum security requirements for secure processing environments.`,
    relatedRecitals: [76],
    crossReferences: [98],
  },
  {
    id: 67,
    title: "Health data access bodies",
    content: `1. Each Member State shall designate one or more health data access bodies to be responsible for granting access to electronic health data for secondary use. Member States shall inform the Commission of the identity of the health data access bodies by 26 March 2027.

2. Health data access bodies shall have the following tasks:
(a) processing applications for access to electronic health data for secondary use;
(b) issuing data permits to health data users;
(c) processing health data requests and providing anonymised statistical data;
(d) operating secure processing environments;
(e) ensuring compliance by health data users with the conditions of data permits;
(f) maintaining a national dataset catalogue;
(g) cooperating with other health data access bodies and relevant authorities;
(h) supervising health data holders in relation to their obligations under this Regulation;
(i) imposing administrative fines and taking enforcement measures.

3. Each Member State shall ensure that each health data access body is provided with adequate human, technical and financial resources.

4. Health data access bodies shall publish annual activity reports containing information on their activities, data access applications processed, and fees collected.`,
    relatedRecitals: [65, 66, 67],
    crossReferences: [],
  },
  {
    id: 68,
    title: "Status of health data access bodies",
    content: `1. Each health data access body shall be a public authority or a body governed by public law.

2. Health data access bodies shall act independently in the performance of their tasks and shall not seek or take instructions from any other body.

3. The members and staff of health data access bodies shall be free from any external influence and shall not seek or accept instructions from any government, institution, person or body.

4. Health data access bodies shall have their own staff and separate annual budgets.`,
    relatedRecitals: [77],
    crossReferences: [],
  },
  {
    id: 69,
    title: "General conditions for health data access bodies",
    content: `1. Health data access bodies shall be subject to the jurisdiction of the Member State that designated them.

2. Health data access bodies shall have the powers and resources necessary to carry out their tasks effectively.

3. Health data access bodies shall cooperate with the supervisory authorities established pursuant to Regulation (EU) 2016/679.

4. Decisions of health data access bodies shall be subject to effective judicial review.`,
    relatedRecitals: [],
    crossReferences: [],
  },
  {
    id: 70,
    title: "Right to lodge a complaint with a health data access body",
    content: `1. Natural persons whose electronic health data are processed for secondary use shall have the right to lodge a complaint with the competent health data access body if they consider that their rights under this Regulation have been infringed.

2. Health data access bodies shall inform the complainant of the progress and outcome of the complaint.

3. Health data access bodies shall cooperate with the supervisory authorities under Regulation (EU) 2016/679 in handling complaints related to data protection.`,
    relatedRecitals: [],
    crossReferences: [],
  },
  {
    id: 71,
    title: "Reporting by health data access bodies",
    content: `1. Health data access bodies shall publish an annual activity report containing at least the following information:
(a) the number and types of applications received;
(b) the number of data permits issued and refused;
(c) the number of health data requests processed;
(d) the fees collected;
(e) the number of complaints received and their outcome;
(f) the enforcement actions taken.

2. Health data access bodies shall submit their annual reports to the EHDS Board.`,
    relatedRecitals: [78],
    crossReferences: [92],
  },
  {
    id: 72,
    title: "Supervision of health data holders",
    content: `1. Health data access bodies shall supervise health data holders to ensure compliance with their obligations under this Regulation.

2. Health data access bodies shall have the power to:
(a) request information from health data holders;
(b) conduct audits and inspections;
(c) issue warnings;
(d) order health data holders to comply with their obligations;
(e) impose administrative fines.

3. The Commission shall, by means of delegated acts, establish the criteria for determining the level of administrative fines.`,
    relatedRecitals: [79],
    crossReferences: [96],
  },
  {
    id: 73,
    title: "Cooperation between health data access bodies",
    content: `1. Health data access bodies shall cooperate with each other and with the Commission to ensure the consistent application of this Regulation.

2. Health data access bodies shall:
(a) exchange information and best practices;
(b) provide mutual assistance;
(c) coordinate on multi-country applications.

3. The EHDS Board shall facilitate cooperation between health data access bodies.`,
    relatedRecitals: [],
    crossReferences: [92],
  },
  {
    id: 74,
    title: "Mutual assistance",
    content: `1. Health data access bodies shall provide each other with relevant information and mutual assistance in order to implement and apply this Regulation in a consistent manner.

2. Requests for assistance shall be responded to without undue delay and in any event within one month.

3. Health data access bodies shall not charge a fee for actions taken following a request for mutual assistance.`,
    relatedRecitals: [],
    crossReferences: [],
  },
  {
    id: 75,
    title: "Authorised participants in HealthData@EU",
    content: `1. The following may become authorised participants in HealthData@EU:
(a) national contact points for secondary use;
(b) Union institutions, bodies, offices and agencies;
(c) research infrastructures established under Regulation (EU) 2021/695;
(d) other entities authorised by Member States.

2. Authorised participants shall comply with the rules and technical requirements established for HealthData@EU.

3. The Commission shall maintain a public list of authorised participants.`,
    relatedRecitals: [],
    crossReferences: [81],
  },
  {
    id: 76,
    title: "Minimum dataset specifications for secondary use",
    content: `1. The Commission shall, by means of delegated acts, establish minimum specifications for datasets made available for secondary use, taking into account existing international and European standards.

2. The specifications shall cover:
(a) data formats and structures;
(b) coding systems and terminologies;
(c) metadata standards;
(d) data quality requirements.`,
    relatedRecitals: [],
    crossReferences: [96],
  },
  {
    id: 77,
    title: "Datasets of high impact for secondary use",
    content: `1. The Commission shall, by means of delegated acts, establish a list of categories of datasets of high impact for secondary use.

2. Health data holders shall give priority to making datasets of high impact available for secondary use.

3. Health data access bodies shall promote access to datasets of high impact for research and innovation.`,
    relatedRecitals: [],
    crossReferences: [96],
  },
  {
    id: 78,
    title: "Requirements for data altruism organisations",
    content: `1. Data altruism organisations processing electronic health data for secondary use shall comply with the requirements of Regulation (EU) 2022/868.

2. Data altruism organisations shall register with a health data access body and cooperate with health data access bodies in ensuring compliance with this Regulation.

3. Natural persons consenting to data altruism shall be informed of their right to withdraw consent at any time.`,
    relatedRecitals: [],
    crossReferences: [],
  },
  {
    id: 79,
    title: "Access to health data by Union institutions",
    content: `1. Union institutions, bodies, offices and agencies may apply for access to electronic health data for secondary use in accordance with this Regulation.

2. Applications from Union institutions shall be processed by the health data access body of the Member State where the data are located.

3. Where Union institutions seek access to data located in multiple Member States, they may apply to any health data access body in those Member States.`,
    relatedRecitals: [],
    crossReferences: [],
  },
  {
    id: 80,
    title: "Access in cases of public health emergency",
    content: `1. In cases of public health emergency, health data access bodies may grant expedited access to electronic health data for secondary use.

2. Expedited access may be granted where the processing is necessary for responding to a serious cross-border threat to health.

3. Health data access bodies shall assess applications for expedited access within two weeks.

4. The Commission may adopt implementing acts specifying the conditions and procedures for expedited access.`,
    relatedRecitals: [],
    crossReferences: [98],
  },
  {
    id: 81,
    title: "HealthData@EU",
    content: `1. The Commission shall establish a cross-border infrastructure for secondary use of electronic health data ('HealthData@EU'). HealthData@EU shall enable and support secondary use by connecting the authorised participants and providing services that facilitate discovery and access to electronic health data.

2. Each Member State shall designate one national contact point for secondary use, as an organisational and technical gateway to the cross-border secondary use of electronic health data. The national contact point for secondary use shall connect to HealthData@EU. Each Member State shall inform the Commission of the identity of its national contact point for secondary use by 26 March 2027.

3. The Commission shall, by means of implementing acts, adopt the necessary measures for the establishment, development and deployment of HealthData@EU.

4. The national contact points for secondary use shall process cross-border requests for access to electronic health data in accordance with this Regulation.

5. HealthData@EU shall comprise the central platform, the national contact points for secondary use, and the authorised participants.`,
    relatedRecitals: [80, 81, 82],
    crossReferences: [98],
  },
  {
    id: 82,
    title: "HealthData@EU infrastructure",
    content: `1. HealthData@EU shall consist of:
(a) a central platform operated by the Commission;
(b) the national contact points for secondary use;
(c) secure processing environments;
(d) common services for discovery, access and analysis.

2. The Commission shall ensure the security, availability and performance of the central platform.

3. The Commission shall, by means of implementing acts, adopt the technical specifications for the HealthData@EU infrastructure.`,
    relatedRecitals: [83],
    crossReferences: [98],
  },
  {
    id: 83,
    title: "Joint controllership for HealthData@EU",
    content: `1. The Commission and the national contact points for secondary use shall act as joint controllers for the personal electronic health data processed through HealthData@EU.

2. The Commission shall, by means of implementing acts, determine the respective responsibilities of the joint controllers.

3. The joint controllers shall make available to data subjects information on the joint controllership arrangement.`,
    relatedRecitals: [],
    crossReferences: [98],
  },
  {
    id: 84,
    title: "Access by third countries to HealthData@EU",
    content: `1. Third countries may apply to become authorised participants in HealthData@EU.

2. A third country may be authorised to participate where:
(a) it has adopted rules on secondary use of electronic health data compatible with this Regulation;
(b) adequate safeguards are in place for the protection of personal data;
(c) reciprocal access is ensured for Union users.

3. The Commission shall, by means of implementing act, decide on the authorisation of third countries to participate in HealthData@EU.`,
    relatedRecitals: [84],
    crossReferences: [98],
  },
  {
    id: 85,
    title: "International transfers of electronic health data",
    content: `1. Electronic health data made available for secondary use may only be transferred to third countries or international organisations in accordance with Chapter V of Regulation (EU) 2016/679.

2. Health data access bodies shall ensure that any transfer to a third country does not undermine the level of protection of natural persons guaranteed by this Regulation.

3. The Commission may adopt implementing acts specifying conditions for international data transfers in the context of secondary use.`,
    relatedRecitals: [85],
    crossReferences: [98],
  },
  {
    id: 86,
    title: "Union-level dataset catalogue",
    content: `1. The Commission shall establish a Union-level dataset catalogue connecting the national dataset catalogues maintained by health data access bodies.

2. The Union-level dataset catalogue shall enable health data users to search and discover datasets available across Member States.

3. The Commission shall ensure interoperability between national dataset catalogues and the Union-level dataset catalogue.`,
    relatedRecitals: [],
    crossReferences: [56],
  },
  {
    id: 87,
    title: "Union-level services",
    content: `1. The Commission may provide Union-level services to support secondary use of electronic health data, including:
(a) data discovery services;
(b) data access request services;
(c) data analysis services;
(d) training and capacity building.

2. Union-level services shall complement and not replace services provided by health data access bodies.`,
    relatedRecitals: [],
    crossReferences: [],
  },
  {
    id: 88,
    title: "Cooperation in cross-border infrastructure",
    content: `1. The Commission and the Member States shall cooperate in the development and operation of cross-border infrastructure for primary and secondary use.

2. The Commission shall facilitate:
(a) the exchange of best practices;
(b) the development of common standards;
(c) capacity building in Member States.

3. The Commission may provide technical and financial assistance to Member States for the implementation of cross-border infrastructure.`,
    relatedRecitals: [86],
    crossReferences: [],
  },
  {
    id: 89,
    title: "Secure cross-border processing environment",
    content: `1. The Commission shall establish a secure cross-border processing environment enabling health data users to access and process electronic health data from multiple Member States.

2. The secure cross-border processing environment shall comply with the security requirements established for national secure processing environments.

3. Health data users shall only access electronic health data through the secure cross-border processing environment when authorised by the relevant health data access bodies.`,
    relatedRecitals: [],
    crossReferences: [66],
  },
  {
    id: 90,
    title: "Governance of cross-border infrastructure",
    content: `1. The Commission shall be responsible for the governance of the central components of the cross-border infrastructure.

2. Member States shall be responsible for the governance of their national contact points.

3. The EHDS Board shall provide guidance on the governance of cross-border infrastructure.`,
    relatedRecitals: [],
    crossReferences: [92],
  },
  {
    id: 91,
    title: "Cybersecurity requirements",
    content: `1. Health data access bodies, national contact points and operators of secure processing environments shall implement appropriate technical and organisational measures to ensure a high level of cybersecurity.

2. The measures referred to in paragraph 1 shall be based on recognised cybersecurity standards and shall include:
(a) risk management procedures;
(b) incident detection and response capabilities;
(c) security testing and auditing;
(d) staff training.

3. The Commission shall, by means of implementing acts, specify minimum cybersecurity requirements.`,
    relatedRecitals: [],
    crossReferences: [98],
  },
  {
    id: 92,
    title: "EHDS Board",
    content: `1. The European Health Data Space Board (the 'EHDS Board') is hereby established to facilitate cooperation and the exchange of information among Member States. The EHDS Board shall be composed of representatives of the digital health authorities and health data access bodies of all Member States. The digital health authorities and health data access bodies shall be represented in the EHDS Board. The Commission shall chair the EHDS Board.

2. The composition, organisation and functioning of the EHDS Board shall be established by means of implementing acts. Those implementing acts shall be adopted in accordance with the examination procedure referred to in Article 98(2).

3. The EHDS Board shall have the following tasks:
(a) assisting the Commission in ensuring consistent application of this Regulation;
(b) preparing non-binding recommendations and guidance documents;
(c) facilitating cooperation among digital health authorities and health data access bodies;
(d) contributing to the development of technical standards and guidelines;
(e) facilitating the sharing of best practices;
(f) advising the Commission on fee policies;
(g) publishing an annual report on the application of this Regulation;
(h) any other tasks assigned by this Regulation.

4. The EHDS Board may establish subgroups for specific matters.

5. The Commission shall provide secretariat support to the EHDS Board.`,
    relatedRecitals: [87, 88],
    crossReferences: [98],
  },
  {
    id: 93,
    title: "Subgroups of the EHDS Board",
    content: `1. The EHDS Board may establish subgroups to examine specific matters, including:
(a) a subgroup on primary use and cross-border healthcare;
(b) a subgroup on secondary use of electronic health data;
(c) a subgroup on EHR systems and interoperability;
(d) a subgroup on data quality and standards.

2. Subgroups may invite experts and stakeholders to participate in their work.

3. Subgroups shall report to the EHDS Board on their activities and findings.`,
    relatedRecitals: [89],
    crossReferences: [92],
  },
  {
    id: 94,
    title: "Stakeholder involvement",
    content: `1. The Commission and the EHDS Board shall consult relevant stakeholders in the implementation of this Regulation.

2. Stakeholders may include:
(a) patient and consumer organisations;
(b) healthcare provider organisations;
(c) health professionals;
(d) research organisations;
(e) industry representatives;
(f) data protection experts.

3. The Commission may establish a stakeholder forum to facilitate structured dialogue.`,
    relatedRecitals: [90],
    crossReferences: [92],
  },
  {
    id: 95,
    title: "Penalties",
    content: `1. Member States shall lay down rules on penalties applicable to infringements of this Regulation and shall take all measures necessary to ensure that they are implemented.

2. The penalties provided for shall be effective, proportionate and dissuasive.

3. Member States shall notify the Commission of those rules and measures by 26 March 2027 and shall notify it without delay of any subsequent amendments affecting them.

4. For infringements of Articles 52, 54, 55 and 65 by health data holders and health data users, the penalties shall include administrative fines of up to EUR 10,000,000, or in the case of an undertaking, up to 2% of total worldwide annual turnover.`,
    relatedRecitals: [91, 92],
    crossReferences: [52, 54, 55, 65],
  },
  {
    id: 96,
    title: "Exercise of the delegation",
    content: `1. The power to adopt delegated acts is conferred on the Commission subject to the conditions laid down in this Article.

2. The power to adopt delegated acts referred to in Articles 14, 52, 54, 55, 63, 64, 72, 76 and 77 shall be conferred on the Commission for an indeterminate period of time from [date of entry into force of this Regulation].

3. The delegation of power referred to in paragraph 2 may be revoked at any time by the European Parliament or by the Council. A decision to revoke shall put an end to the delegation of the power specified in that decision.

4. Before adopting a delegated act, the Commission shall consult experts designated by each Member State in accordance with the principles laid down in the Interinstitutional Agreement of 13 April 2016 on Better Law-Making.

5. As soon as it adopts a delegated act, the Commission shall notify it simultaneously to the European Parliament and to the Council.

6. A delegated act adopted pursuant to this Regulation shall enter into force only if no objection has been expressed either by the European Parliament or by the Council within a period of two months of notification of that act to the European Parliament and to the Council or if, before the expiry of that period, the European Parliament and the Council have both informed the Commission that they will not object.`,
    relatedRecitals: [],
    crossReferences: [14, 52, 54, 55, 63, 64, 72, 76, 77],
  },
  {
    id: 97,
    title: "Evaluation and review",
    content: `1. By 26 March 2032, and every five years thereafter, the Commission shall evaluate this Regulation and present a report on its main findings to the European Parliament and to the Council.

2. The evaluation shall assess:
(a) the effectiveness of the Regulation in achieving its objectives;
(b) the impact on the rights of natural persons;
(c) the functioning of health data access bodies;
(d) the operation of cross-border infrastructure;
(e) the impact on innovation and research;
(f) the administrative burden on stakeholders.

3. For the purpose of the evaluation, Member States and health data access bodies shall provide the Commission with relevant information.

4. Where appropriate, the Commission shall submit a legislative proposal to amend this Regulation.`,
    relatedRecitals: [93, 94],
    crossReferences: [],
  },
  {
    id: 98,
    title: "Committee procedure",
    content: `1. The Commission shall be assisted by a committee. That committee shall be a committee within the meaning of Regulation (EU) No 182/2011.

2. Where reference is made to this paragraph, Article 5 of Regulation (EU) No 182/2011 shall apply.

3. Where the committee delivers no opinion, the Commission shall not adopt the draft implementing act and the third subparagraph of Article 5(4) of Regulation (EU) No 182/2011 shall apply.`,
    relatedRecitals: [],
    crossReferences: [],
  },
  {
    id: 99,
    title: "Entry into force and application",
    content: `1. This Regulation shall enter into force on the twentieth day following that of its publication in the Official Journal of the European Union.

2. It shall apply from 26 March 2027.

3. However:
(a) Chapter III shall apply from 26 March 2029;
(b) Article 23 shall apply from 26 March 2028;
(c) Article 81 shall apply from 26 March 2029.

This Regulation shall be binding in its entirety and directly applicable in all Member States.

Done at Strasbourg, 11 February 2025.`,
    relatedRecitals: [95, 96],
    crossReferences: [23, 81],
  },
];

export function getArticleById(id: number): Article | undefined {
  return articles.find((a) => a.id === id);
}

export function getArticlesByChapter(chapterId: number): Article[] {
  const { chapters } = require('./chapters');
  const chapter = chapters.find((ch: any) => ch.id === chapterId);
  if (!chapter) return [];
  return articles.filter(
    (a) => a.id >= chapter.articleRange[0] && a.id <= chapter.articleRange[1]
  );
}

export function searchArticles(query: string): Article[] {
  const lowerQuery = query.toLowerCase();
  return articles.filter(
    (a) =>
      a.title.toLowerCase().includes(lowerQuery) ||
      a.content.toLowerCase().includes(lowerQuery)
  );
}
