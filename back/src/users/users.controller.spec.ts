import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    getUserProfileById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      const mockUserProfile = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const req = { user: { userId: 1 } };
      mockUsersService.getUserProfileById.mockResolvedValue(mockUserProfile);

      const result = await controller.getProfile(req);

      expect(usersService.getUserProfileById).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        success: true,
        code: 200,
        message: 'Profile retrieved successfully',
        user: mockUserProfile,
      });
    });

    it('should throw NotFoundException when user is not found', async () => {
      const req = { user: { userId: 999 } };
      mockUsersService.getUserProfileById.mockResolvedValue(null);

      await expect(controller.getProfile(req)).rejects.toThrow(NotFoundException);
      expect(usersService.getUserProfileById).toHaveBeenCalledWith(999);
    });
  });
});