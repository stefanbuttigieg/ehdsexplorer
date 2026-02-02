-- Add source field to definitions table to track origin of definitions
ALTER TABLE public.definitions 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'ehds_regulation';

-- Add comment explaining sources
COMMENT ON COLUMN public.definitions.source IS 'Source of the definition: ehds_regulation (Article 2), eu_ehr_glossary (EU EHR Database), xt_ehr (Xt-EHR project)';

-- Create index for source filtering
CREATE INDEX IF NOT EXISTS idx_definitions_source ON public.definitions(source);

-- Insert EU EHR Database glossary terms (avoiding duplicates based on term)
INSERT INTO public.definitions (term, definition, source)
SELECT v.term, v.definition, 'eu_ehr_glossary'
FROM (VALUES
  ('AI', 'Artificial Intelligence see Regulation (EU) 2024/1689.'),
  ('CE marking', 'CE marking of conformity means a marking by which the manufacturer indicates that the EHR system is in conformity with the applicable requirements set out in the Regulation EHDS 2024/ Regulation and other applicable Union law providing for its affixing pursuant to Regulation (EC) No 765/2008.'),
  ('Clinical care', 'Healthcare act that is delivered by a healthcare professional in a clinical setting (being inpatient or outpatient) which involves patient-clinician interaction.'),
  ('Clinician', 'Healthcare professional directly involved in patient care. It includes doctors, nurses, therapists.'),
  ('Directive (EU) 2019/882', 'European Accessibility Act.'),
  ('Doctor', 'Used to describe medical doctors and dentists in a large context. It includes physicians and surgeons in a more specific context.'),
  ('Economic operator', 'Means the manufacturer, the authorised representative, the importer, the distributor, the fulfilment service provider or any other natural or legal person who is subject to obligations in relation to the manufacture of products, making them available on the market or putting them into service in accordance with the relevant Union harmonisation legislation.'),
  ('EHDS', 'European Health Data Space see European Commission page.'),
  ('EHR', 'Electronic Health Record.'),
  ('EHR system', 'Means any system whereby the software, or a combination of the hardware and the software of that system, allows personal electronic health data that belong to the priority categories to be stored, intermediated, exported, imported, converted, edited or viewed, and intended by the manufacturer to be used by healthcare providers when providing patient care or by patients when accessing their electronic health data.'),
  ('Electronic instructions for use', 'Means the information provided by the manufacturer to inform the user of a device''s intended purpose and proper use and of any precautions to be taken.'),
  ('End-user', 'Means any natural or legal person residing or established in the Union, to whom a product has been made available either as a consumer outside of any trade, business, craft or profession or as a professional end user in the course of its industrial or professional activities.'),
  ('Essential requirements', 'Refers to essential requirements for the harmonised software components of EHR systems and for products for which interoperability with EHR systems has been claimed as laid down in Annex II of EHDS regulation.'),
  ('EU declaration of conformity', 'The EU declaration of conformity states that the manufacturer of an EHR system has demonstrated that the essential requirements laid down in Annex II have been fulfilled.'),
  ('European digital testing environment', 'Refers to the digital testing environments used by the manufacturers and operated by the relevant Member States for assessing their EHR systems compliance with the harmonised software components.'),
  ('European electronic health record exchange format', 'Set of technical specifications, targeted at ensuring the interoperability of electronic health record systems placed on the European Union market, in order to make electronic health data accessible and transmissible, at least for the priority categories.'),
  ('European interoperability software component', 'Means a software component of the EHR system which provides and receives personal electronic health data under a priority category for primary use in the European electronic health record exchange format and which is independent of the European logging software component.'),
  ('European logging software component', 'Means a software component of the EHR system which provides logging information related to access by health professionals or other individuals to priority categories of personal electronic health data.'),
  ('Harmonised software components', 'Refers to a European interoperability software component and a European logging software component that should be included in an EHR system, in accordance with Chapter III of EHDS Regulation.'),
  ('Healthcare professional', 'Includes doctors (medical care), nurses, physical therapists, dietitians and other allied health professionals. A person that through qualifications and expertise is allowed to deliver care with the intention of diagnosing, treating, or preventing illness or injury.'),
  ('Healthcare specialties', 'Includes medicine specialties and other healthcare specialties (e.g. preventive care).'),
  ('Healthcare', 'Includes clinical and non-clinical care. Healthcare encompasses a broad range of services and practices to maintain the overall health and wellness of a population.'),
  ('Implementing act', 'Means a non-legislative act laying down detailed rules allowing the uniform implementation of legally binding Union acts. Technical specifications for the harmonised software components should be defined by means of implementing acts.'),
  ('Importer', 'Means any natural or legal person established within the Union who places a product from a third country on the Union market.'),
  ('Information sheet', 'Documentation that accompanies an EHR system, as referred to in Article 38 EHDS Regulation.'),
  ('Intended purpose', 'Means the use for which a device is intended according to the data supplied by the manufacturer on the label, in the instructions for use or in promotional or sales materials.'),
  ('Interoperability', 'Means the ability of organisations, as well as of software applications or devices from the same manufacturer or different manufacturers, to interact through the processes they support, involving the exchange of information and knowledge, without changing the content of the data.'),
  ('Interoperable high-risk AI systems', 'High-risk AI systems in accordance with Article 6 of Regulation (EU) 2024/1689 for which the manufacturer claims interoperability with the harmonized components.'),
  ('Interoperable in vitro diagnostic medical device', 'In vitro diagnostic medical devices according to Regulation (EU) 2017/746 for which the manufacturer claims interoperability with the harmonized components.'),
  ('Interoperable medical devices', 'Medical devices according to Regulation (EU) 2017/745 MDR for which the manufacturer claims interoperability with the harmonized components.'),
  ('Label', 'Refers to the label issued by the manufacturer of the wellness application that indicates its compliance with the specifications and requirements as per EHDS Regulation.'),
  ('Making available on the market', 'Means any supply of a product for distribution, consumption or use on the Union market in the course of a commercial activity, whether in return for payment or free of charge.'),
  ('Mandate', 'Refers to the appointment of an Authorised Representative and specifies the tasks to be performed on behalf of the manufacturer.'),
  ('Manufacturer', 'Means any natural or legal person who manufactures a product or has a product designed or manufactured, and markets that product under its name or trademark.'),
  ('Market introduction', 'Refers to either the introduction of a new product or an update of an existing one.'),
  ('Market Surveillance', 'Means the activities carried out and measures taken by market surveillance authorities to ensure that products comply with the requirements set out in the applicable Union harmonisation legislation.'),
  ('Medicine specialities', 'Related to specific diseases or conditions e.g. cardiology, neurology, oncology. Branches of medical care that address specific systems, organs or functions of the body.'),
  ('Non-clinical care', 'Supports healthcare system operation and broader public health goal.'),
  ('Non compliance', 'Means any failure to comply with any requirement under EHDS Regulation and other related applicable legislation.'),
  ('Non conformity', 'Refers to a deviation from a requirement, specification, standard or rules.'),
  ('Priority categories', 'Refers to the list of priority categories of personal electronic health data for primary use: Patient summaries, Electronic prescriptions, Electronic dispensations, Medical imaging studies and related imaging reports, Medical test results including laboratory and other diagnostic results and related reports, Discharge reports.'),
  ('Procurer', 'Professional end-user in charge of products purchase.'),
  ('Product classification', 'Refers to the product categorization to facilitate search and find suitable systems for end-users.'),
  ('Product presenting a risk', 'Means a product having the potential to affect adversely health and safety of persons in general, health and safety in the workplace, protection of consumers, the environment, public security and other public interests.'),
  ('Product presenting a serious risk', 'Means a product presenting a risk, for which, based on a risk assessment and taking into account the normal and foreseeable use of the product, the combination of the probability of occurrence of a hazard causing harm and the degree of severity of the harm is considered to require rapid intervention.'),
  ('Product type', 'Refers to the type of product: EHR system, Wellness applications, Interoperable medical device, Interoperable in vitro diagnostic medical device, Interoperable high-risk AI.'),
  ('Putting into service', 'Means the first use, for its intended purpose, in the Union of an EHR system covered by the Regulation.'),
  ('Recall', 'Process to remove a system after reaching consumers and that may involve recommendations or specific actions.'),
  ('Regulation (EC) 765/2008', 'CE Marking EU Regulation.'),
  ('Regulation (EU) 182/2011', 'Examination procedure (article 5).'),
  ('Regulation (EU) 2016/679', 'GDPR: General Data Protection EU Regulation.'),
  ('Regulation (EU) 2017/746', 'In Vitro diagnostic medical devices EU Regulation.'),
  ('Regulation (EU) 2019/1020', 'Market surveillance and compliance of products EU Regulation.'),
  ('Regulation (EU) 2024/1689', 'Artificial Intelligence EU Regulation.'),
  ('Regulation (EU) EHDS', 'EHDS Regulation.'),
  ('Regulation (EU) 2017/745', 'Medical Devices EU Regulation.'),
  ('Risk', 'Means the combination of the probability of an occurrence of a hazard causing harm to health, safety or information security and the degree of severity of such harm.'),
  ('Risk classification', 'Refers to the level of risk associated with the product.'),
  ('Serious incident', 'Means any malfunction or deterioration in the characteristics or performance of an EHR system made available on the market that directly or indirectly leads, might have led or might lead to death of a natural person, serious harm to health, serious prejudice to rights, or serious disruption of critical infrastructure in the health sector.'),
  ('Software suite', 'Means a bundle of systems, designed to work seamlessly together, that can expand functionality upon needs.'),
  ('Supplier', 'Any natural or legal person that is part of a supply chain.'),
  ('Supply chain', 'Consists of the economic operators supplying a given product.'),
  ('Technical documentation', 'Documentation associated to an EHR system that demonstrates that the EHR system complies with the essential requirements laid down in Annex II and provides market surveillance authorities with all the necessary information to assess conformity.'),
  ('Wellness app', 'Means any software, or any combination of hardware and software, intended by the manufacturer to be used by a natural person, for the processing of electronic health data, specifically for providing information on the health of natural persons, or the delivery of care for purposes other than the provision of healthcare.'),
  ('Withdrawal', 'Refers to any measure aimed at preventing a product in the supply chain from being made available on the market Regulation (EU) 2019/1020.')
) AS v(term, definition)
WHERE NOT EXISTS (
  SELECT 1 FROM public.definitions d 
  WHERE LOWER(d.term) = LOWER(v.term)
);