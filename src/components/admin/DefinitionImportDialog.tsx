import { useState } from 'react';
import { Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface ImportDefinition {
  term: string;
  definition: string;
  isDuplicate?: boolean;
}

// Xt-EHR Glossary data extracted from https://www.xt-ehr.eu/glossary-list/
const XT_EHR_GLOSSARY: ImportDefinition[] = [
  { term: "Big Data in Health", definition: "Large routinely or automatically collected datasets, which are electronically captured and stored. It is reusable for the purpose of ongoing care, administrative and policy requirements in real time to improve health outcomes and health system performance." },
  { term: "Clinical Decision Support System (CDSS)", definition: "Computer-based system that analyses data within EHRs to provide prompts and reminders to assist health care providers in implementing evidence-based clinical guidelines at the point of care." },
  { term: "Compliance", definition: "The adherence by a product and/or service provider to the regulatory, legal and mandatory requirements." },
  { term: "Conformance", definition: "Fulfilment of specified functional and technical requirements." },
  { term: "Conformity Assessment", definition: "Process that evaluates the extent to which a product, process or service fulfils relevant standards and/or technical specifications." },
  { term: "Cross-border eHealth Services", definition: "eHealth services rendered across EU member states through exchange of digital health data across national borders using the MyHealth@EU infrastructure. This includes ePrescription and eDispensation and the Patient Summary." },
  { term: "Data Altruism Organisation", definition: "A legal entity registered by a national authority which collects and processes personal data based on consent or non-personal data for general interest purposes, such as scientific research or improving public services, as defined in the Data Governance Act." },
  { term: "Data Exchange Format", definition: "A structured format for encoding data for storage or transmission between systems." },
  { term: "Data Holder", definition: "Natural person or legal entity with the legal right to grant access to data under their control." },
  { term: "Data Intermediary", definition: "Provider of data intermediation services as defined in the Data Governance Act." },
  { term: "Data Permit", definition: "An administrative decision issued to a data user by a health data access body, to process specific electronic health data for specific secondary use purposes." },
  { term: "Data Quality", definition: "The state of data being fit for its intended uses in operations, decision making and planning." },
  { term: "Data Request", definition: "A request in relation to specific electronic health data for a specific purpose made by a data user to a health data access body." },
  { term: "Data User", definition: "A natural or legal person who has lawful access to personal or non-personal electronic health data for secondary use." },
  { term: "Digital Health", definition: "Overarching concept including eHealth, mHealth and emerging areas such as the use of advanced computing sciences in big data, genomics and artificial intelligence." },
  { term: "EHR System", definition: "Any appliance or software intended by the manufacturer to be used for storing, intermediating, importing, exporting, converting, editing or viewing electronic health records." },
  { term: "Electronic Health Data", definition: "Data concerning health and genetic data as defined in GDPR, as well as data referring to determinants of health, or data processed in relation to the provision of healthcare services, processed in an electronic form." },
  { term: "Electronic Health Record (EHR)", definition: "A collection of electronic health data related to a natural person that is collected within the health system for primary use, processed by EHR systems and/or made available through a health data access service." },
  { term: "Electronic Prescription (ePrescription)", definition: "A prescription for a medicinal product or medical device issued and transmitted electronically by an authorised prescriber to a dispensary." },
  { term: "eDispensation", definition: "Information about the supply of a medicinal product by a pharmacy to a patient based on an electronic prescription." },
  { term: "Functional Requirements", definition: "Statements of services the system should provide, how the system should react to particular inputs and how the system should behave in particular situations." },
  { term: "Guidelines", definition: "Systematically developed statements and recommendations designed to help practitioners and patients in making decisions about appropriate healthcare for specific circumstances." },
  { term: "Health Data Access Body", definition: "A body established by a Member State to implement and apply rules on access to electronic health data for secondary use, responsible for granting data permits and facilitating data access." },
  { term: "Health Information Exchange", definition: "The electronic transmission of healthcare-related data among medical facilities, health information organizations, and government agencies according to national or regional standards." },
  { term: "HL7", definition: "Health Level Seven International - an organization that develops standards for the exchange, integration, sharing, and retrieval of electronic health information." },
  { term: "HL7 FHIR", definition: "Fast Healthcare Interoperability Resources - a standard describing data formats and elements and an application programming interface for exchanging electronic health records." },
  { term: "IHE", definition: "Integrating the Healthcare Enterprise - an initiative that promotes the coordinated use of established standards to improve how computer systems in healthcare share information." },
  { term: "Implementation Guide", definition: "A document providing specific instructions for implementing a standard or specification in a particular context." },
  { term: "Interoperability", definition: "The ability of organizations and/or software to interact and exchange information without changing the content and meaning of the exchanged data." },
  { term: "Laboratory Result Report", definition: "A document containing the results of laboratory tests performed on samples from a patient." },
  { term: "Medical Device", definition: "Any instrument, apparatus, appliance, software, material or other article used for diagnosis, prevention, monitoring, treatment, or alleviation of disease." },
  { term: "Medical Imaging Report", definition: "A document containing the findings and interpretation of medical imaging studies such as X-rays, CT scans, MRI, and ultrasound." },
  { term: "MyHealth@EU", definition: "The official infrastructure for the cross-border exchange of electronic health data between EU Member States, enabling services like ePrescription, Patient Summary, and Laboratory Results." },
  { term: "National Contact Point for eHealth (NCPeH)", definition: "A gateway established by each EU Member State to enable the cross-border exchange of electronic health data through MyHealth@EU." },
  { term: "Patient Summary", definition: "A standardized set of basic medical data including information on allergies, current medication, previous illnesses, and surgical procedures, designed to improve patient safety in cross-border care." },
  { term: "Personal Health Data", definition: "Data concerning the physical or mental health of a natural person, including the provision of health care services, which reveal information about their health status." },
  { term: "Primary Use of Health Data", definition: "The processing of personal electronic health data for the provision of healthcare services to assess, maintain, or restore the state of health of a natural person." },
  { term: "Quality Management System", definition: "A formalized system that documents processes, procedures, and responsibilities for achieving quality policies and objectives." },
  { term: "Reference Architecture", definition: "A document or set of documents that provides recommended structures and integrations of IT products and services to form a solution." },
  { term: "Regulation", definition: "A binding legislative act that must be applied in its entirety across the EU." },
  { term: "Secondary Use of Health Data", definition: "The processing of electronic health data for purposes beyond individual healthcare, including research, innovation, policy-making, and public health monitoring." },
  { term: "Semantic Interoperability", definition: "The ability of computer systems to exchange data with unambiguous, shared meaning." },
  { term: "SNOMED CT", definition: "Systematized Nomenclature of Medicine - Clinical Terms, a comprehensive clinical terminology used for the electronic exchange of clinical health information." },
  { term: "Standard", definition: "A document established by consensus and approved by a recognized body that provides rules, guidelines, or characteristics for activities or their results." },
  { term: "Technical Interoperability", definition: "The ability of two or more systems or components to exchange information using agreed data formats, communication protocols, and interfaces." },
  { term: "Telemedicine", definition: "The delivery of healthcare services, where distance is a critical factor, by healthcare professionals using information and communication technologies." },
  { term: "Terminology", definition: "A system of terms belonging to a specialist subject, including definitions and relationships between terms." },
  { term: "Value Set", definition: "A set of codes from one or more code systems, used for a specific purpose." },
  { term: "Wellness Application", definition: "A software application intended to maintain or encourage a healthy lifestyle, focusing on general well-being rather than treating specific medical conditions." },
];

interface DefinitionImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingTerms: string[];
}

export function DefinitionImportDialog({
  open,
  onOpenChange,
  existingTerms,
}: DefinitionImportDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [selectedTerms, setSelectedTerms] = useState<Set<string>>(new Set());
  const [importComplete, setImportComplete] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  // Mark duplicates
  const glossaryWithDuplicates = XT_EHR_GLOSSARY.map(item => ({
    ...item,
    isDuplicate: existingTerms.some(
      t => t.toLowerCase() === item.term.toLowerCase()
    ),
  }));

  const duplicateCount = glossaryWithDuplicates.filter(g => g.isDuplicate).length;
  const newTermsCount = glossaryWithDuplicates.filter(g => !g.isDuplicate).length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allNew = glossaryWithDuplicates
        .filter(g => !g.isDuplicate)
        .map(g => g.term);
      setSelectedTerms(new Set(allNew));
    } else {
      setSelectedTerms(new Set());
    }
  };

  const handleToggleTerm = (term: string) => {
    const newSet = new Set(selectedTerms);
    if (newSet.has(term)) {
      newSet.delete(term);
    } else {
      newSet.add(term);
    }
    setSelectedTerms(newSet);
  };

  const handleImport = async () => {
    if (selectedTerms.size === 0) {
      toast({
        title: 'No terms selected',
        description: 'Please select at least one term to import.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    try {
      const termsToImport = glossaryWithDuplicates
        .filter(g => selectedTerms.has(g.term))
        .map(g => ({
          term: g.term,
          definition: g.definition,
          source: 'xt_ehr' as const,
          source_article: null,
        }));

      // Insert definitions
      const { data: insertedDefs, error } = await supabase
        .from('definitions')
        .insert(termsToImport)
        .select('id, term, definition');

      if (error) throw error;

      // Also create entries in definition_sources table
      if (insertedDefs && insertedDefs.length > 0) {
        const sourceEntries = insertedDefs.map(def => ({
          definition_id: def.id,
          source: 'xt_ehr' as const,
          source_text: def.definition,
          source_article: null,
        }));

        const { error: sourceError } = await supabase
          .from('definition_sources')
          .insert(sourceEntries);

        if (sourceError) {
          console.error('Error creating source entries:', sourceError);
        }
      }

      setImportedCount(termsToImport.length);
      setImportComplete(true);
      
      toast({
        title: 'Import Successful',
        description: `${termsToImport.length} definitions imported from Xt-EHR Glossary.`,
      });

      queryClient.invalidateQueries({ queryKey: ['admin-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['definitions'] });
      queryClient.invalidateQueries({ queryKey: ['definition-sources'] });
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import definitions',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedTerms(new Set());
    setImportComplete(false);
    setImportedCount(0);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import Xt-EHR Glossary
          </DialogTitle>
          <DialogDescription>
            Import definitions from the Xt-EHR project glossary. Terms that already exist in your database are marked as duplicates.
          </DialogDescription>
        </DialogHeader>

        {importComplete ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Import Complete!</h3>
            <p className="text-muted-foreground">
              Successfully imported {importedCount} definitions from Xt-EHR.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Stats */}
            <div className="flex gap-4">
              <Badge variant="outline" className="text-sm">
                {XT_EHR_GLOSSARY.length} total terms
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {newTermsCount} new
              </Badge>
              {duplicateCount > 0 && (
                <Badge variant="destructive" className="text-sm">
                  {duplicateCount} duplicates
                </Badge>
              )}
            </div>

            {duplicateCount > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {duplicateCount} terms already exist in your database. Use the Merge feature to combine definitions if needed.
                </AlertDescription>
              </Alert>
            )}

            {/* Select all */}
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <Checkbox
                id="select-all"
                checked={selectedTerms.size === newTermsCount && newTermsCount > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="cursor-pointer">
                Select all new terms ({newTermsCount})
              </Label>
            </div>

            {/* Term list */}
            <ScrollArea className="flex-1 border rounded-lg p-2 max-h-[300px]">
              <div className="space-y-2">
                {glossaryWithDuplicates.map((item) => (
                  <div
                    key={item.term}
                    className={`p-3 rounded-lg ${
                      item.isDuplicate 
                        ? 'bg-destructive/10 opacity-60' 
                        : selectedTerms.has(item.term)
                          ? 'bg-primary/10 border border-primary'
                          : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedTerms.has(item.term)}
                        onCheckedChange={() => handleToggleTerm(item.term)}
                        disabled={item.isDuplicate}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{item.term}</span>
                          {item.isDuplicate && (
                            <Badge variant="destructive" className="text-xs">
                              Duplicate
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.definition}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {importComplete ? 'Close' : 'Cancel'}
          </Button>
          {!importComplete && (
            <Button 
              onClick={handleImport} 
              disabled={selectedTerms.size === 0 || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Import {selectedTerms.size} Definitions
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
