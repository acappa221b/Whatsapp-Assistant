import { ArchitectureHarness } from './architecture.harness'
import { ApiHarness, UIHarness } from './api-ui.harness'
import { ConfigurationHarness } from './configuration.harness'
import { DatabaseHarness } from './database.harness'
import { AIHarness, ExcelHarness, SecurityHarness, WhatsAppHarness } from './domain.harness'
import {
  CategoryDomainHarness,
  ExpenseDomainHarness,
  RevenueDomainHarness,
  SupplierDomainHarness,
  UserDomainHarness,
} from './epic-02/domain-spec.harness'
import {
  CategoryImplementationHarness,
  ExpenseImplementationHarness,
  RevenueImplementationHarness,
  SupplierImplementationHarness,
  UserImplementationHarness,
} from './epic-02/implementation.harness'
import {
  MapperHarness,
  MigrationHarness,
  PrismaRepositoryHarness,
  PrismaSchemaHarness,
  SeedHarness,
} from './epic-03'
import {
  QrCodeHarness,
  WhatsappDashboardHarness,
  WhatsappEventHarness,
  WhatsappPersistenceHarness,
  WhatsappProviderHarness,
} from './epic-04'
import {
  MessagePipelineHarness,
  ProcessorHarness,
  QueueHarness,
  ReprocessingHarness,
} from './epic-05'
import {
  AIProviderHarness,
  ExtractionHarness,
  ExtractionPersistenceHarness,
  SchemaHarness,
} from './epic-06'
import {
  DocumentProcessorHarness,
  ExtractionMetadataHarness,
  ImageProcessorHarness,
  MediaSecurityHarness,
  MediaStorageHarness,
  VisionHarness,
} from './epic-07'
import {
  ApprovalQueueSpecHarness,
  CandidateItemSpecHarness,
  Epic08ReadinessHarness,
  FinancialCandidateSpecHarness,
} from './epic-08'
import {
  ApiErrorHandlingHarness,
  HealthEndpointHarness,
  MigrationConsistencyHarness,
  RuntimeDatabaseHarness,
  WhatsappConnectHarness,
} from './rc-01'
import {
  ChatDiscoveryHarness,
  PipelineBootstrapHarness,
  SessionRestoreHarness,
  StartupReconnectHarness,
  StatusApiHarness,
} from './rc-03'
import {
  Assistant01AHarness,
} from './assistant-01a'
import { Rc04Harnesses } from './rc-04'
import { Rc05Harnesses } from './rc-05'
import { Rc06Harnesses } from './rc-06'
import { Rc06MessageFidelityHarnesses } from './rc-06-message-fidelity'
import { Rc07Harnesses } from './rc-07'
import { Rc08bHarnesses } from './rc-08b'
import { Rc09Harnesses } from './rc-09'
import { Rc10Harnesses } from './rc-10'
import { Rc10bHarnesses } from './rc-10b'
import { Rc11Harnesses } from './rc-11'
import { Rc12Harnesses } from './rc-12'
import { Rc13Harnesses } from './rc-13'
import { Rc14Harnesses } from './rc-14'
import { Rc14bHarnesses } from './rc-14b'
import { Rc15Harnesses } from './rc-15'
import { Rc16Harnesses } from './rc-16'
import { Rc17Harnesses } from './rc-17'
import { Rc18Harnesses } from './rc-18'
import { Rc18bHarnesses } from './rc-18b'
import { Rc19Harnesses } from './rc-19'
import { Rc20Harnesses } from './rc-20'
import { Rc21Harnesses } from './rc-21'
import { Rc22aHarnesses } from './rc-22a'
import { RepoHygieneHarnesses } from './repo-hygiene'
import {
  Assistant01PlanningHarness,
  Assistant01ReportsPlaceholderHarness,
  Assistant01SpecHarness,
} from './epic-assistant-01'
import { SpecHarness } from './spec.harness'

const harnesses = [
  ArchitectureHarness,
  ConfigurationHarness,
  SpecHarness,
  DatabaseHarness,
  ApiHarness,
  UIHarness,
  AIHarness,
  WhatsAppHarness,
  ExcelHarness,
  SecurityHarness,
  ExpenseDomainHarness,
  RevenueDomainHarness,
  CategoryDomainHarness,
  SupplierDomainHarness,
  UserDomainHarness,
  ExpenseImplementationHarness,
  RevenueImplementationHarness,
  CategoryImplementationHarness,
  SupplierImplementationHarness,
  UserImplementationHarness,
  PrismaSchemaHarness,
  MigrationHarness,
  MapperHarness,
  PrismaRepositoryHarness,
  SeedHarness,
  WhatsappProviderHarness,
  WhatsappPersistenceHarness,
  WhatsappEventHarness,
  WhatsappDashboardHarness,
  QrCodeHarness,
  MessagePipelineHarness,
  ProcessorHarness,
  QueueHarness,
  ReprocessingHarness,
  ExtractionHarness,
  AIProviderHarness,
  SchemaHarness,
  ExtractionPersistenceHarness,
  VisionHarness,
  MediaStorageHarness,
  ImageProcessorHarness,
  DocumentProcessorHarness,
  MediaSecurityHarness,
  ExtractionMetadataHarness,
  FinancialCandidateSpecHarness,
  CandidateItemSpecHarness,
  ApprovalQueueSpecHarness,
  Epic08ReadinessHarness,
  RuntimeDatabaseHarness,
  MigrationConsistencyHarness,
  HealthEndpointHarness,
  WhatsappConnectHarness,
  ApiErrorHandlingHarness,
  StartupReconnectHarness,
  SessionRestoreHarness,
  PipelineBootstrapHarness,
  ChatDiscoveryHarness,
  StatusApiHarness,
  Assistant01SpecHarness,
  Assistant01PlanningHarness,
  Assistant01ReportsPlaceholderHarness,
  Assistant01AHarness,
  ...Rc04Harnesses,
  ...Rc05Harnesses,
  ...Rc06Harnesses,
  ...Rc06MessageFidelityHarnesses,
  ...Rc07Harnesses,
  ...Rc08bHarnesses,
  ...Rc09Harnesses,
  ...Rc10Harnesses,
  ...Rc10bHarnesses,
  ...Rc11Harnesses,
  ...Rc12Harnesses,
  ...Rc13Harnesses,
  ...Rc14Harnesses,
  ...Rc14bHarnesses,
  ...Rc15Harnesses,
  ...Rc16Harnesses,
  ...Rc17Harnesses,
  ...Rc18Harnesses,
  ...Rc18bHarnesses,
  ...Rc19Harnesses,
  ...Rc20Harnesses,
  ...Rc21Harnesses,
  ...Rc22aHarnesses,
  ...RepoHygieneHarnesses,
]

async function main() {
  let failed = 0

  for (const harness of harnesses) {
    const result = await harness.run()
    const status = result.passed ? 'PASS' : 'FAIL'
    console.log(`[${status}] ${result.name}`)
    for (const error of result.errors) {
      console.log(`  - ${error}`)
    }
    if (!result.passed) failed++
  }

  if (failed > 0) {
    process.exitCode = 1
    console.log(`\n${failed} harness(es) failed`)
  } else {
    console.log('\nAll harnesses passed')
  }
}

main()
