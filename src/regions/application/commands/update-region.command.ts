import { RegionState } from 'src/regions/domain/regions.model';

export type UpdateRegionCommand = Omit<RegionState, ''>;
