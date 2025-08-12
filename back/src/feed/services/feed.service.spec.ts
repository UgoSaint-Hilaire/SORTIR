import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { FeedService } from '../services/feed.service';
import { UsersService } from '../../users/services/users.service';
import { Event } from '../../events/schemas/event.schema';
import { GetFeedDto } from '../dto/get-feed.dto';

describe('FeedService', () => {
  let service: FeedService;
  let mockEventModel: any;
  let mockUsersService: any;

  const mockEvents = [
    {
      _id: '1',
      ticketmasterId: 'tm1',
      name: 'Concert Rock',
      date: { localDate: '2025-08-15', localTime: '20:00:00' },
      segment: 'Musique',
      genre: 'Rock',
      status: 'onsale',
      syncedAt: '2025-08-12T10:00:00Z',
    },
    {
      _id: '2',
      ticketmasterId: 'tm2',
      name: 'Match Football',
      date: { localDate: '2025-08-16', localTime: '19:00:00' },
      segment: 'Sports',
      genre: 'Football',
      status: 'onsale',
      syncedAt: '2025-08-12T11:00:00Z',
    },
    {
      _id: '3',
      ticketmasterId: 'tm3',
      name: 'Pièce Théâtre',
      date: { localDate: '2025-08-17', localTime: '21:00:00' },
      segment: 'Arts & Théâtre',
      genre: 'Théâtre',
      status: 'onsale',
      syncedAt: '2025-08-12T12:00:00Z',
    },
  ];

  const mockUserPreferences = [
    {
      id: 1,
      userId: 1,
      classificationId: 'rock-id',
      classificationName: 'Rock',
    },
    {
      id: 2,
      userId: 1,
      classificationId: 'football-id',
      classificationName: 'Football',
    },
  ];

  beforeEach(async () => {
    mockEventModel = {
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      countDocuments: jest.fn(),
    };

    mockUsersService = {
      getUserPreferences: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: getModelToken(Event.name),
          useValue: mockEventModel,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCustomFeed', () => {
    it('should return personalized feed with user preferences', async () => {
      const userId = 1;
      const query: GetFeedDto = { page: 1, limit: 20 };

      mockUsersService.getUserPreferences.mockResolvedValue(mockUserPreferences);
      mockEventModel.exec.mockResolvedValue([mockEvents[0], mockEvents[1]]);
      mockEventModel.countDocuments.mockResolvedValue(2);

      const result = await service.getCustomFeed(userId, query);

      expect(result.events).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.noResultsReason).toBeNull();
      expect(mockUsersService.getUserPreferences).toHaveBeenCalledWith(userId);
    });

    it('should return no_preferences reason when user has no preferences', async () => {
      const userId = 1;
      const query: GetFeedDto = { page: 1, limit: 20 };

      mockUsersService.getUserPreferences.mockResolvedValue([]);
      mockEventModel.exec.mockResolvedValue(mockEvents);
      mockEventModel.countDocuments.mockResolvedValue(3);

      const result = await service.getCustomFeed(userId, query);

      expect(result.noResultsReason).toBe('no_preferences');
      expect(result.events).toHaveLength(3);
    });

    it('should return no_matching_genres reason when no events match preferences', async () => {
      const userId = 1;
      const query: GetFeedDto = { page: 1, limit: 20 };

      mockUsersService.getUserPreferences.mockResolvedValue([
        { classificationName: 'Jazz' },
      ]);
      mockEventModel.exec.mockResolvedValue([]);
      mockEventModel.countDocuments.mockResolvedValue(0);

      const result = await service.getCustomFeed(userId, query);

      expect(result.noResultsReason).toBe('no_matching_genres');
      expect(result.events).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should filter by preferred genres', async () => {
      const userId = 1;
      const query: GetFeedDto = { page: 1, limit: 20 };

      mockUsersService.getUserPreferences.mockResolvedValue([
        { classificationName: 'Rock' },
      ]);
      mockEventModel.exec.mockResolvedValue([mockEvents[0]]);
      mockEventModel.countDocuments.mockResolvedValue(1);

      await service.getCustomFeed(userId, query);

      expect(mockEventModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          genre: { $in: ['Rock'] },
        })
      );
    });

    it('should apply date and time filtering', async () => {
      const userId = 1;
      const query: GetFeedDto = { page: 1, limit: 20 };

      mockUsersService.getUserPreferences.mockResolvedValue(mockUserPreferences);
      mockEventModel.exec.mockResolvedValue([]);
      mockEventModel.countDocuments.mockResolvedValue(0);

      await service.getCustomFeed(userId, query);

      expect(mockEventModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            expect.objectContaining({
              'date.localDate': expect.objectContaining({ $gt: expect.any(String) }),
            }),
            expect.objectContaining({
              'date.localDate': expect.any(String),
              'date.localTime': expect.objectContaining({ $gte: expect.any(String) }),
            }),
          ]),
        })
      );
    });

    it('should handle pagination correctly', async () => {
      const userId = 1;
      const query: GetFeedDto = { page: 2, limit: 10 };

      mockUsersService.getUserPreferences.mockResolvedValue(mockUserPreferences);
      mockEventModel.exec.mockResolvedValue([mockEvents[0]]);
      mockEventModel.countDocuments.mockResolvedValue(25);

      const result = await service.getCustomFeed(userId, query);

      expect(mockEventModel.skip).toHaveBeenCalledWith(10);
      expect(mockEventModel.limit).toHaveBeenCalledWith(10);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });
  });

  describe('getAllEventsFeed', () => {
    it('should return all events without filters', async () => {
      const query: GetFeedDto = { page: 1, limit: 20 };

      mockEventModel.exec.mockResolvedValue(mockEvents);
      mockEventModel.countDocuments.mockResolvedValue(3);

      const result = await service.getAllEventsFeed(query);

      expect(result.events).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
    });

    it('should filter by segment when provided', async () => {
      const query: GetFeedDto = { page: 1, limit: 20, segment: 'Sports' };

      mockEventModel.exec.mockResolvedValue([mockEvents[1]]);
      mockEventModel.countDocuments.mockResolvedValue(1);

      await service.getAllEventsFeed(query);

      expect(mockEventModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          segment: 'Sports',
        })
      );
    });

    it('should filter by genre when provided', async () => {
      const query: GetFeedDto = { page: 1, limit: 20, genre: 'Rock' };

      mockEventModel.exec.mockResolvedValue([mockEvents[0]]);
      mockEventModel.countDocuments.mockResolvedValue(1);

      await service.getAllEventsFeed(query);

      expect(mockEventModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          genre: 'Rock',
        })
      );
    });

    it('should filter by both segment and genre when provided', async () => {
      const query: GetFeedDto = { page: 1, limit: 20, segment: 'Musique', genre: 'Rock' };

      mockEventModel.exec.mockResolvedValue([mockEvents[0]]);
      mockEventModel.countDocuments.mockResolvedValue(1);

      await service.getAllEventsFeed(query);

      expect(mockEventModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          segment: 'Musique',
          genre: 'Rock',
        })
      );
    });
  });

  describe('getDiscoveryFeed', () => {
    it('should exclude user preferred genres', async () => {
      const userId = 1;
      const query: GetFeedDto = { page: 1, limit: 20 };

      mockUsersService.getUserPreferences.mockResolvedValue([
        { classificationName: 'Rock' },
      ]);
      mockEventModel.exec.mockResolvedValue([mockEvents[1], mockEvents[2]]);
      mockEventModel.countDocuments.mockResolvedValue(2);

      await service.getDiscoveryFeed(userId, query);

      expect(mockEventModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          genre: { $nin: ['Rock'] },
        })
      );
    });

    it('should return all events when user has no preferences', async () => {
      const userId = 1;
      const query: GetFeedDto = { page: 1, limit: 20 };

      mockUsersService.getUserPreferences.mockResolvedValue([]);
      mockEventModel.exec.mockResolvedValue(mockEvents);
      mockEventModel.countDocuments.mockResolvedValue(3);

      await service.getDiscoveryFeed(userId, query);

      expect(mockEventModel.find).toHaveBeenCalledWith(
        expect.not.objectContaining({
          genre: expect.anything(),
        })
      );
    });
  });

  describe('getPublicFeed', () => {
    beforeEach(() => {
      // Mock pour les requêtes par segment
      mockEventModel.exec
        .mockResolvedValueOnce([mockEvents[0]]) // Musique
        .mockResolvedValueOnce([mockEvents[1]]) // Sports
        .mockResolvedValueOnce([mockEvents[2]]); // Arts & Théâtre

      mockEventModel.countDocuments.mockResolvedValue(3);
    });

    it('should return mixed events from all segments', async () => {
      const query: GetFeedDto = { page: 1, limit: 30 };

      const result = await service.getPublicFeed(query);

      expect(result.events).toHaveLength(3);
      expect(result.pagination.limit).toBe(30);
      expect(mockEventModel.find).toHaveBeenCalledTimes(3); // Une fois par segment
    });

    it('should distribute events equally among segments', async () => {
      const query: GetFeedDto = { page: 1, limit: 30 };

      await service.getPublicFeed(query);

      // Vérifier que chaque segment est appelé avec une limite équitable
      expect(mockEventModel.limit).toHaveBeenCalledWith(10); // 30/3 = 10 par segment
    });

    it('should handle remainder distribution for uneven limits', async () => {
      const query: GetFeedDto = { page: 1, limit: 31 }; // 31/3 = 10 + remainder 1

      await service.getPublicFeed(query);

      expect(mockEventModel.limit).toHaveBeenCalledWith(11); // Premier segment avec +1
      expect(mockEventModel.limit).toHaveBeenCalledWith(10); // Autres segments
    });

    it('should shuffle events', async () => {
      const query: GetFeedDto = { page: 1, limit: 30 };

      const result = await service.getPublicFeed(query);

      // Le shuffle est aléatoire, on vérifie juste que les événements sont présents
      expect(result.events).toHaveLength(3);
      const eventIds = result.events.map(e => e._id);
      expect(eventIds).toContain('1');
      expect(eventIds).toContain('2');
      expect(eventIds).toContain('3');
    });
  });

  describe('shuffleArray', () => {
    it('should shuffle array elements', () => {
      const originalArray = [1, 2, 3, 4, 5];
      const shuffled = (service as any).shuffleArray(originalArray);

      expect(shuffled).toHaveLength(originalArray.length);
      expect(shuffled).toEqual(expect.arrayContaining(originalArray));
      // Le shuffle étant aléatoire, on ne peut pas prédire l'ordre exact
    });

    it('should not modify original array', () => {
      const originalArray = [1, 2, 3, 4, 5];
      const originalCopy = [...originalArray];

      (service as any).shuffleArray(originalArray);

      expect(originalArray).toEqual(originalCopy);
    });

    it('should handle empty array', () => {
      const emptyArray: any[] = [];
      const shuffled = (service as any).shuffleArray(emptyArray);

      expect(shuffled).toEqual([]);
    });

    it('should handle single element array', () => {
      const singleArray = [1];
      const shuffled = (service as any).shuffleArray(singleArray);

      expect(shuffled).toEqual([1]);
    });
  });
});