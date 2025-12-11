export interface AnnexSection {
  title: string;
  content: string;
}

export interface Annex {
  id: string;
  title: string;
  description: string;
  relatedArticles: number[];
  sections: AnnexSection[];
}

export const annexes: Annex[] = [
  {
    id: "I",
    title: "Main characteristics of priority categories of personal electronic health data",
    description: "This Annex sets out the main characteristics and content requirements for each priority category of personal electronic health data for primary use.",
    relatedArticles: [14, 15],
    sections: [
      {
        title: "1. Patient summary",
        content: `A patient summary shall include the following main characteristics:

(a) personal and contact information:
- identification of the patient;
- contact information;

(b) administrative information:
- health insurance information;
- treating healthcare provider information;

(c) medical history:
- allergies and intolerances;
- current and resolved diagnoses;
- past medical history;
- vaccinations;
- surgical procedures;

(d) current medication:
- medications prescribed and dispensed;
- dose and dosage instructions;

(e) care plan information where relevant:
- treatment plans;
- care objectives;

(f) additional clinical information:
- blood group;
- pregnancy status;
- social history relevant for healthcare;
- functional status;
- medical alerts;
- medical devices and implants.`
      },
      {
        title: "2. Electronic prescription",
        content: `An electronic prescription shall include the following main characteristics:

(a) identification of the patient;

(b) identification of the prescriber and the healthcare provider;

(c) prescription date and, where applicable, dispensation date;

(d) identification of the prescribed medicinal product:
- product name;
- active substance(s);
- pharmaceutical form;
- strength;
- pack size;

(e) dose and dosage instructions:
- quantity;
- frequency;
- duration of treatment;
- route of administration;

(f) instructions for the patient;

(g) validity of the prescription;

(h) reimbursement status where applicable;

(i) indication or reason for prescription where relevant.`
      },
      {
        title: "3. Electronic dispensation",
        content: `An electronic dispensation shall include the following main characteristics:

(a) identification of the patient;

(b) identification of the dispenser and the pharmacy;

(c) dispensation date;

(d) identification of the dispensed medicinal product:
- product name;
- active substance(s);
- pharmaceutical form;
- strength;
- pack size;
- batch number where applicable;

(e) reference to the prescription;

(f) quantity dispensed;

(g) substitution information where applicable.`
      },
      {
        title: "4. Medical images and image reports",
        content: `Medical images and image reports shall include the following main characteristics:

(a) identification of the patient;

(b) identification of the healthcare provider and professional performing the examination;

(c) date and time of the examination;

(d) type of imaging examination:
- imaging modality;
- body region examined;

(e) imaging data:
- medical images in standard format (DICOM);
- relevant metadata;

(f) image report:
- clinical question;
- technique used;
- findings;
- conclusion;
- recommendations where applicable.`
      },
      {
        title: "5. Laboratory results",
        content: `Laboratory results shall include the following main characteristics:

(a) identification of the patient;

(b) identification of the laboratory and requesting healthcare provider;

(c) sample collection date and time;

(d) result issue date;

(e) type of laboratory test:
- test name;
- test code;

(f) results:
- measured value;
- unit of measure;
- reference range;
- interpretation where applicable;

(g) specimen information:
- specimen type;
- collection method where relevant;

(h) comments or clinical notes where applicable.`
      },
      {
        title: "6. Hospital discharge report",
        content: `A hospital discharge report shall include the following main characteristics:

(a) identification of the patient;

(b) identification of the hospital and treating healthcare providers;

(c) admission and discharge dates;

(d) type of encounter:
- reason for admission;
- discharge disposition;

(e) diagnoses:
- principal diagnosis;
- secondary diagnoses;
- diagnoses at discharge;

(f) procedures performed:
- surgical procedures;
- other significant procedures;

(g) clinical summary:
- history of present illness;
- hospital course;
- significant findings;

(h) medications at discharge:
- medication list;
- changes from admission medications;

(i) follow-up instructions:
- recommendations;
- scheduled appointments;
- warnings and precautions.`
      }
    ]
  },
  {
    id: "II",
    title: "Essential requirements for EHR systems",
    description: "This Annex sets out the essential requirements that EHR systems must meet for interoperability, security, and logging capabilities.",
    relatedArticles: [27, 28, 31, 35],
    sections: [
      {
        title: "Section 1: General requirements",
        content: `1. EHR systems shall be designed and developed in such a way that they achieve the performance intended by the manufacturer and ensure that, when used under the conditions and for the purposes intended, they do not compromise the safety and health of patients or users.

2. EHR systems shall be designed and manufactured to ensure:
(a) that the risks to patients, users and third persons are eliminated or reduced as far as possible;
(b) appropriate performance throughout the intended lifetime of the system;
(c) appropriate security against reasonably foreseeable risks.

3. EHR systems shall be designed to ensure data integrity throughout their intended lifetime.

4. The design and manufacture of EHR systems shall take account of state-of-the-art technical developments.

5. EHR systems shall ensure that personal electronic health data are processed in accordance with Regulation (EU) 2016/679.`
      },
      {
        title: "Section 2: Interoperability requirements",
        content: `1. EHR systems shall be capable of exchanging personal electronic health data in the European electronic health record exchange format referred to in Article 15.

2. The European interoperability software component of the EHR system shall:
(a) receive personal electronic health data of priority categories from other EHR systems in the European electronic health record exchange format;
(b) export personal electronic health data of priority categories in the European electronic health record exchange format;
(c) convert personal electronic health data to and from the European electronic health record exchange format.

3. EHR systems shall support the use of:
(a) international coding systems and terminologies;
(b) standard data models and structures;
(c) secure communication protocols.

4. EHR systems shall enable the identification of patients and health professionals in accordance with applicable Union and national law.

5. EHR systems shall be capable of connecting to electronic health data access services and health professional access services.`
      },
      {
        title: "Section 3: Security and logging requirements",
        content: `1. EHR systems shall implement appropriate technical and organisational measures to ensure a high level of security, including:
(a) access control mechanisms;
(b) encryption of data at rest and in transit;
(c) authentication and authorisation procedures;
(d) audit logging capabilities;
(e) backup and recovery procedures.

2. The European logging software component of the EHR system shall:
(a) record all access to personal electronic health data by health professionals;
(b) record the identity of the health professional accessing the data;
(c) record the date and time of access;
(d) record which personal electronic health data were accessed;
(e) retain logging information for at least three years.

3. The logging mechanism shall:
(a) ensure the integrity of log records;
(b) protect log records against unauthorised access, modification or deletion;
(c) enable the provision of logging information to natural persons in accordance with Article 9.

4. EHR systems shall be designed to detect security incidents and support incident response.

5. EHR systems shall implement measures to prevent unauthorised access, disclosure, alteration or destruction of personal electronic health data.`
      },
      {
        title: "Section 4: Performance requirements",
        content: `1. EHR systems shall achieve the performance characteristics intended by the manufacturer under normal conditions of use.

2. The manufacturer shall specify:
(a) the intended users of the EHR system;
(b) the intended purpose and context of use;
(c) the environment in which the EHR system is intended to be used;
(d) the categories of personal electronic health data to be processed;
(e) performance specifications and limitations.

3. EHR systems shall be reliable and function consistently throughout their intended lifetime.

4. Any deterioration in performance that might affect the safety of patients or users shall be communicated to users.`
      }
    ]
  },
  {
    id: "III",
    title: "Technical documentation for EHR systems",
    description: "This Annex specifies the contents of the technical documentation that manufacturers must draw up for EHR systems.",
    relatedArticles: [34, 35],
    sections: [
      {
        title: "1. General description of the EHR system",
        content: `The technical documentation shall include:

(a) product identification:
- product name and version;
- model or type designation;
- unique product identifier;

(b) identification of the manufacturer:
- name and address;
- contact details;
- authorised representative where applicable;

(c) intended purpose:
- description of intended purpose;
- intended users;
- intended environment of use;
- categories of patients whose data will be processed;

(d) general description:
- description of the EHR system and its main components;
- software architecture;
- hardware requirements where applicable;
- description of variants or configurations.`
      },
      {
        title: "2. Design and manufacturing information",
        content: `The technical documentation shall include:

(a) design specifications:
- design inputs and requirements;
- design outputs;
- design verification and validation results;

(b) information concerning interoperability:
- supported data formats and standards;
- European electronic health record exchange format compliance;
- integration interfaces and APIs;

(c) information concerning security:
- risk assessment and management;
- security measures implemented;
- cybersecurity certification where applicable;

(d) information concerning the European logging software component:
- logging mechanism description;
- log data structure and content;
- log retention and protection measures.`
      },
      {
        title: "3. Verification and validation",
        content: `The technical documentation shall include:

(a) verification results:
- testing protocols and results;
- conformity testing with essential requirements;
- interoperability testing results;

(b) validation results:
- clinical evaluation where relevant;
- usability testing results;
- performance validation;

(c) declaration of conformity:
- conformity with applicable common specifications;
- conformity with harmonised standards where used.`
      },
      {
        title: "4. Instructions for use and labelling",
        content: `The technical documentation shall include:

(a) labels and labelling:
- CE marking;
- product identification;
- manufacturer identification;
- warnings and precautions;

(b) instructions for use:
- description of the product and its functions;
- installation and configuration instructions;
- instructions for safe and effective use;
- maintenance and update procedures;
- troubleshooting guidance;
- information on interoperability;
- security guidelines for users.`
      },
      {
        title: "5. Post-market surveillance",
        content: `The technical documentation shall include:

(a) post-market surveillance plan:
- procedures for collecting and analysing user feedback;
- procedures for detecting and reporting incidents;
- procedures for implementing corrective actions;

(b) record of incidents and corrective actions:
- analysis of incidents reported;
- corrective and preventive actions taken;
- communication to authorities and users.`
      }
    ]
  },
  {
    id: "IV",
    title: "EU declaration of conformity",
    description: "This Annex specifies the content of the EU declaration of conformity for EHR systems.",
    relatedArticles: [32, 35],
    sections: [
      {
        title: "Content of the EU declaration of conformity",
        content: `The EU declaration of conformity shall contain all of the following information:

1. Name and address of the manufacturer and, where applicable, of the authorised representative.

2. A statement that the EU declaration of conformity is issued under the sole responsibility of the manufacturer.

3. Identification of the EHR system allowing traceability:
(a) product name;
(b) product type or model;
(c) version number;
(d) batch or serial number where applicable;
(e) any other relevant information enabling identification of the EHR system.

4. Intended purpose of the EHR system.

5. A statement that the EHR system that is the subject of the declaration is in conformity with this Regulation.

6. References to any relevant harmonised standards used or references to the common specifications referred to in Article 31 in relation to which conformity is declared.

7. Where applicable, the name, address and identification number of the notified body that carried out the conformity assessment procedure and a reference to the certificate issued.

8. Where applicable, a statement that the EHR system meets additional requirements of other Union legislation.

9. Any additional information required under other Union legislation applicable to the EHR system.

10. Place and date of issue of the declaration.

11. Name, function and signature of the person authorised to sign the declaration on behalf of the manufacturer or the authorised representative.`
      },
      {
        title: "Language requirements",
        content: `1. The EU declaration of conformity shall be drawn up in one of the official languages of the Union.

2. Where an EHR system is placed on the market or put into service in a Member State, the EU declaration of conformity shall be translated into the language or languages required by that Member State.

3. Where the original EU declaration of conformity is not in the language required, a translation shall be provided together with the original declaration.`
      },
      {
        title: "Format requirements",
        content: `1. The EU declaration of conformity shall follow the model structure set out in this Annex.

2. The EU declaration of conformity may be in paper or electronic format.

3. Where the EU declaration of conformity is in electronic format, it shall be made available on the website of the manufacturer or shall be provided by the manufacturer upon request.

4. The EU declaration of conformity shall be kept up to date by the manufacturer.

5. A copy of the EU declaration of conformity shall be kept by the manufacturer for at least 10 years after the EHR system has been placed on the market.`
      }
    ]
  }
];

export function getAnnexById(id: string): Annex | undefined {
  return annexes.find((a) => a.id === id);
}

export function searchAnnexes(query: string): Annex[] {
  const lowerQuery = query.toLowerCase();
  return annexes.filter(
    (a) =>
      a.title.toLowerCase().includes(lowerQuery) ||
      a.description.toLowerCase().includes(lowerQuery) ||
      a.sections.some(
        (s) =>
          s.title.toLowerCase().includes(lowerQuery) ||
          s.content.toLowerCase().includes(lowerQuery)
      )
  );
}
