import { useState } from "react";
import { useFhir } from "../context/FhirContext";
import type { MediaItem } from "../lib/types";

import { DocumentBanner } from "./DocumentBanner";
import { PatientHeader } from "./PatientHeader";
import { InfoGrid } from "./InfoGrid";
import { TabBar } from "./TabBar";
import type { TabDef } from "./TabBar";
import { MediaViewerModal } from "./MediaViewerModal";

import { OverviewTab } from "./tabs/OverviewTab";
import { ConditionsTab } from "./tabs/ConditionsTab";
import { MedicationsTab } from "./tabs/MedicationsTab";
import { ObservationsTab } from "./tabs/ObservationsTab";
import { DiagnosticReportsTab } from "./tabs/DiagnosticReportsTab";
import { AllergiesTab } from "./tabs/AllergiesTab";
import { ImmunizationsTab } from "./tabs/ImmunizationsTab";
import { ProceduresTab } from "./tabs/ProceduresTab";
import { FamilyHistoryTab } from "./tabs/FamilyHistoryTab";
import { ServiceRequestsTab } from "./tabs/ServiceRequestsTab";
import { BillingTab } from "./tabs/BillingTab";
import { EncountersTab } from "./tabs/EncountersTab";
import { DocumentRefsTab } from "./tabs/DocumentRefsTab";
import { CarePlanTab } from "./tabs/CarePlanTab";
import { CoverageTab } from "./tabs/CoverageTab";
import { DevicesTab } from "./tabs/DevicesTab";
import { AlertsTab } from "./tabs/AlertsTab";
import { DirectivesTab } from "./tabs/DirectivesTab";
import { FunctionalStatusTab } from "./tabs/FunctionalStatusTab";
import { IPSSummaryTab } from "./tabs/IPSSummaryTab";
import { AllResourcesTab } from "./tabs/AllResourcesTab";
import { RawJsonTab } from "./tabs/RawJsonTab";

function count(
  resourceMap: Record<string, unknown[]>,
  ...types: string[]
): number {
  return types.reduce(
    (sum, t) => sum + ((resourceMap[t] as unknown[] | undefined)?.length || 0),
    0,
  );
}

function isIpsDoc(docTypeName: string): boolean {
  return (
    docTypeName.toLowerCase().includes("ips") ||
    docTypeName.toLowerCase().includes("patient summary")
  );
}

export function RecordView() {
  const { resourceMap, docType } = useFhir();
  const [activeTab, setActiveTab] = useState("overview");
  const [mediaItem, setMediaItem] = useState<MediaItem | null>(null);

  const ips = isIpsDoc(docType.name);

  // Build tab list dynamically based on available resources.
  // For IPS documents, IPS Summary appears right after Overview.
  const tabs: TabDef[] = [
    { id: "overview", label: "Overview" },
    // IPS Summary — second position for IPS documents
    ips && { id: "ips", label: "IPS Summary" },
    count(resourceMap, "Composition", "Encounter") > 0 && {
      id: "encounters",
      label: "Encounters",
      count: count(resourceMap, "Composition", "Encounter"),
    },
    count(resourceMap, "Condition") > 0 && {
      id: "conditions",
      label: "Conditions",
      count: count(resourceMap, "Condition"),
    },
    count(resourceMap, "MedicationRequest", "MedicationStatement") > 0 && {
      id: "medications",
      label: "Medications",
      count: count(resourceMap, "MedicationRequest", "MedicationStatement"),
    },
    count(resourceMap, "Observation") > 0 && {
      id: "observations",
      label: "Observations",
      count: count(resourceMap, "Observation"),
    },
    count(resourceMap, "DiagnosticReport") > 0 && {
      id: "reports",
      label: "Reports",
      count: count(resourceMap, "DiagnosticReport"),
    },
    count(resourceMap, "AllergyIntolerance") > 0 && {
      id: "allergies",
      label: "Allergies",
      count: count(resourceMap, "AllergyIntolerance"),
    },
    count(resourceMap, "Immunization") > 0 && {
      id: "immunizations",
      label: "Immunizations",
      count: count(resourceMap, "Immunization"),
    },
    count(resourceMap, "Procedure") > 0 && {
      id: "procedures",
      label: "Procedures",
      count: count(resourceMap, "Procedure"),
    },
    count(resourceMap, "FamilyMemberHistory") > 0 && {
      id: "family",
      label: "Family Hx",
      count: count(resourceMap, "FamilyMemberHistory"),
    },
    count(resourceMap, "ServiceRequest") > 0 && {
      id: "orders",
      label: "Orders",
      count: count(resourceMap, "ServiceRequest"),
    },
    count(resourceMap, "Invoice", "ChargeItem") > 0 && {
      id: "billing",
      label: "Billing",
      count: count(resourceMap, "Invoice", "ChargeItem"),
    },
    count(resourceMap, "DocumentReference") > 0 && {
      id: "documents",
      label: "Documents",
      count: count(resourceMap, "DocumentReference"),
    },
    count(resourceMap, "CarePlan", "Goal") > 0 && {
      id: "careplan",
      label: "Care Plan",
      count: count(resourceMap, "CarePlan", "Goal"),
    },
    count(resourceMap, "Coverage") > 0 && {
      id: "coverage",
      label: "Coverage",
      count: count(resourceMap, "Coverage"),
    },
    count(resourceMap, "Device", "DeviceUseStatement") > 0 && {
      id: "devices",
      label: "Devices",
      count: count(resourceMap, "Device", "DeviceUseStatement"),
    },
    count(resourceMap, "Flag") > 0 && {
      id: "alerts",
      label: "Alerts",
      count: count(resourceMap, "Flag"),
    },
    count(resourceMap, "Consent") > 0 && {
      id: "directives",
      label: "Directives",
      count: count(resourceMap, "Consent"),
    },
    count(resourceMap, "ClinicalImpression") > 0 && {
      id: "functional",
      label: "Functional",
      count: count(resourceMap, "ClinicalImpression"),
    },
    { id: "all", label: "All Resources" },
    { id: "raw", label: "Raw JSON" },
  ].filter(Boolean) as TabDef[];

  function renderTab() {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />;
      case "encounters":
        return <EncountersTab />;
      case "conditions":
        return <ConditionsTab />;
      case "medications":
        return <MedicationsTab />;
      case "observations":
        return <ObservationsTab />;
      case "reports":
        return <DiagnosticReportsTab onOpenMedia={setMediaItem} />;
      case "allergies":
        return <AllergiesTab />;
      case "immunizations":
        return <ImmunizationsTab />;
      case "procedures":
        return <ProceduresTab />;
      case "family":
        return <FamilyHistoryTab />;
      case "orders":
        return <ServiceRequestsTab />;
      case "billing":
        return <BillingTab />;
      case "documents":
        return <DocumentRefsTab onOpenMedia={setMediaItem} />;
      case "careplan":
        return <CarePlanTab />;
      case "coverage":
        return <CoverageTab />;
      case "devices":
        return <DevicesTab />;
      case "alerts":
        return <AlertsTab />;
      case "directives":
        return <DirectivesTab />;
      case "functional":
        return <FunctionalStatusTab />;
      case "ips":
        return <IPSSummaryTab />;
      case "all":
        return <AllResourcesTab />;
      case "raw":
        return <RawJsonTab />;
      default:
        return <OverviewTab />;
    }
  }

  return (
    <div className="prism-py-16 prism-px-14 prism-my-0 prism-mx-auto prism-max-w-1050">
      <DocumentBanner />
      <PatientHeader />
      <InfoGrid />
      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <div className="prism-py-20 prism-my-0 prism-w-full">
        {renderTab()}
      </div>
      <MediaViewerModal item={mediaItem} onClose={() => setMediaItem(null)} />
    </div>
  );
}
