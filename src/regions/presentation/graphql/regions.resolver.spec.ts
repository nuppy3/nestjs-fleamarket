import { Test, TestingModule } from '@nestjs/testing';
import { RegionsResolver } from './regions.resolver';

describe('RegionsResolver', () => {
  let resolver: RegionsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegionsResolver],
    }).compile();

    resolver = module.get<RegionsResolver>(RegionsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
