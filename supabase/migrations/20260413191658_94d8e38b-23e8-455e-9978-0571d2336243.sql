
ALTER TABLE definition_sources DROP CONSTRAINT definition_sources_source_check;
ALTER TABLE definition_sources ADD CONSTRAINT definition_sources_source_check 
  CHECK (source = ANY (ARRAY['ehds_regulation', 'eu_ehr_glossary', 'xt_ehr', 'implementing_act']));
