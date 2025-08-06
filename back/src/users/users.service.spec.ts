import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@test.com');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@test.com');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'nonexistent@test.com' } });
      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { username: 'nonexistent' } });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@test.com',
        password: 'hashedPassword',
      };
      const mockUser = {
        id: 1,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create('testuser', 'test@test.com', 'hashedPassword');

      expect(repository.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@test.com',
        password: 'hashedPassword',
      });
      expect(repository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserProfileById', () => {
    it('should return user profile without password when user exists', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserProfileById(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should return null when user is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserProfileById(999);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
      expect(result).toBeNull();
    });
  });
});