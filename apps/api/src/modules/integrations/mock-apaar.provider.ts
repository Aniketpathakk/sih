import {
  IdentityProviderMode,
  IdentityVerificationStatus,
} from '@apaar-shield/contracts';

export interface IdentityVerificationResult {
  providerCode: string;
  mode: IdentityProviderMode;
  status: IdentityVerificationStatus;
  providerReference: string;
  checkedAt: string;
  productionVerified: boolean;
  returnedClaims: Record<string, unknown>;
}

export class MockApaarProvider {
  private mode: IdentityProviderMode = 'MOCK';

  /**
   * Verifies APAAR reference through the mock adapter.
   * NEVER returns productionVerified: true.
   */
  public async verify(
    apaar: string,
    studentName: string
  ): Promise<IdentityVerificationResult> {
    const checkedAt = new Date().toISOString();
    const cleanApaar = (apaar || '').trim();

    // Edge case simulation for test scenarios
    if (cleanApaar.endsWith('9999')) {
      // Simulates provider outage / gateway timeout
      return {
        providerCode: 'MOCK_APAAR_SERVICE',
        mode: this.mode,
        status: 'PROVIDER_UNAVAILABLE',
        providerReference: `MOCK-REF-TIMEOUT-${Date.now()}`,
        checkedAt,
        productionVerified: false,
        returnedClaims: {},
      };
    }

    if (cleanApaar.endsWith('8888')) {
      // Simulates demographic mismatch
      return {
        providerCode: 'MOCK_APAAR_SERVICE',
        mode: this.mode,
        status: 'MISMATCH',
        providerReference: `MOCK-REF-MISMATCH-${Date.now()}`,
        checkedAt,
        productionVerified: false,
        returnedClaims: {
          providedName: studentName,
          registeredNameHash: 'mismatched_hash_ref',
        },
      };
    }

    // Default mock success scenario
    return {
      providerCode: 'MOCK_APAAR_SERVICE',
      mode: this.mode,
      status: 'MOCK_VERIFIED',
      providerReference: `MOCK-REF-${cleanApaar.slice(-6)}`,
      checkedAt,
      productionVerified: false,
      returnedClaims: {
        academicIdentityValid: true,
        abcAccountId: `ABC-${cleanApaar.slice(-8)}`,
        issuanceAuthority: 'Mock Ministry of Education Identity Registry',
      },
    };
  }
}

export const mockApaarProvider = new MockApaarProvider();

