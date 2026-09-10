import { farmIntelligenceService } from '../intelligence/farmIntelligenceService.js';

export const createFarmApi = () => ({
  async getFarmIntelligence(farmId) {
    return farmIntelligenceService.getFarmSnapshot(farmId);
  },

  async getCropIntelligence(cropId) {
    return farmIntelligenceService.getCropSnapshot(cropId);
  }
});

export const farmApi = createFarmApi();
