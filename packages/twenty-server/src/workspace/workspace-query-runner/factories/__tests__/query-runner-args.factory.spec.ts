import { Test, TestingModule } from '@nestjs/testing';

import { WorkspaceQueryRunnerOptions } from 'src/workspace/workspace-query-runner/interfaces/query-runner-option.interface';
import { FieldMetadataInterface } from 'src/metadata/field-metadata/interfaces/field-metadata.interface';

import { WorkspaceDataSourceService } from 'src/workspace/workspace-datasource/workspace-datasource.service';
import { RecordPositionQueryFactory } from 'src/workspace/workspace-query-builder/factories/record-position-query.factory';
import { QueryRunnerArgsFactory } from 'src/workspace/workspace-query-runner/factories/query-runner-args.factory';
import { FieldMetadataType } from 'src/metadata/field-metadata/field-metadata.entity';

describe('QueryRunnerArgsFactory', () => {
  const workspaceDataSourceService = {
    getSchemaName: jest.fn().mockResolvedValue('test schema'),
    executeRawQuery: jest.fn(),
  };
  const recordPositionQueryFactory = {
    create: jest.fn().mockResolvedValue('test query'),
  };
  const options = {
    fieldMetadataCollection: [
      { name: 'position', type: FieldMetadataType.POSITION },
    ] as FieldMetadataInterface[],
  } as WorkspaceQueryRunnerOptions;

  let factory: QueryRunnerArgsFactory;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryRunnerArgsFactory,
        {
          provide: RecordPositionQueryFactory,
          useValue: {
            create: recordPositionQueryFactory.create,
          },
        },
        {
          provide: WorkspaceDataSourceService,
          useValue: workspaceDataSourceService,
        },
      ],
    }).compile();

    factory = module.get<QueryRunnerArgsFactory>(QueryRunnerArgsFactory);
  });

  it('should be defined', () => {
    expect(factory).toBeDefined();
  });

  describe('create', () => {
    it('should return the args when empty', async () => {
      const args = {};
      const result = await factory.create(args, options);

      expect(result).toEqual(args);
    });

    it('should override position when of type string', async () => {
      const args = {
        position: 'first',
      };

      workspaceDataSourceService.executeRawQuery.mockResolvedValue([
        { position: 2 },
      ]);

      const result = await factory.create(args, options);

      expect(result).toEqual({
        position: 1, // Calculates 2 / 2
      });
    });

    it('should override args when of type array', async () => {
      const args = [{ id: 1 }, { position: 'last' }];

      workspaceDataSourceService.executeRawQuery.mockResolvedValue([
        { position: 1 },
      ]);

      const result = await factory.create(args, options);

      expect(result).toEqual([
        { id: 1 },
        { position: 2 }, // Calculates 1 + 1
      ]);
    });
  });
});
