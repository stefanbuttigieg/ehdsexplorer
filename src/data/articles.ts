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
  // Continue with more articles...
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
