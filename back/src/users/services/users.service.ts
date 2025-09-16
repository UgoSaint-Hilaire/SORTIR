import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { UserPreference } from "../entities/user-preference.entity";
import { UserFavorite } from "../entities/user-favorite.entity";
import { getClassificationId } from "../../events/constants/ticketmaster-classifications";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserPreference)
    private userPreferenceRepository: Repository<UserPreference>,
    @InjectRepository(UserFavorite)
    private userFavoriteRepository: Repository<UserFavorite>
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(username: string, email: string, password: string): Promise<User> {
    const user = this.usersRepository.create({ 
      username, 
      email, 
      password,
      role: 'member'
    });
    return this.usersRepository.save(user);
  }

  async getUserProfileById(id: number): Promise<any | null> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      return null;
    }

    const preferences = await this.getUserPreferences(id);
    const userPreferences = preferences.map((p) => p.classificationName);

    const { password, ...userProfile } = user;
    return {
      ...userProfile,
      userPreferences,
    };
  }

  // Méthodes pour les préférences utilisateur (genres uniquement)
  async createPreferences(userId: number, data: any): Promise<UserPreference[]> {
    if (!data.classificationNames || !Array.isArray(data.classificationNames)) {
      throw new BadRequestException("classificationNames doit être un tableau");
    }

    if (data.classificationNames.length === 0) {
      throw new BadRequestException("Au moins un nom de classification est requis");
    }

    // Supprimer toutes les préférences existantes de l'utilisateur
    await this.userPreferenceRepository.delete({ userId });

    const createdPreferences: UserPreference[] = [];

    for (const classificationName of data.classificationNames) {
      const classificationId = getClassificationId(classificationName);
      if (!classificationId) {
        throw new BadRequestException(`Classification "${classificationName}" non trouvée`);
      }

      const preference = this.userPreferenceRepository.create({
        userId,
        classificationId,
        classificationName,
      });

      const savedPreference = await this.userPreferenceRepository.save(preference);
      createdPreferences.push(savedPreference);
    }

    return createdPreferences;
  }

  async getUserPreferences(userId: number): Promise<UserPreference[]> {
    return this.userPreferenceRepository.find({
      where: { userId },
      order: { classificationName: "ASC" },
    });
  }

  // async updatePreference(userId: number, preferenceId: number, data: any): Promise<UserPreference> {
  //   const preference = await this.userPreferenceRepository.findOne({
  //     where: { id: preferenceId, userId },
  //   });

  //   if (!preference) {
  //     throw new NotFoundException("Préférence non trouvée");
  //   }

  //   Pour l'instant, pas de champs modifiables après création
  //   On pourrait ajouter d'autres champs modifiables ici plus tard

  //   return this.userPreferenceRepository.save(preference);
  // }

  async deletePreference(userId: number, preferenceId: number): Promise<void> {
    const result = await this.userPreferenceRepository.delete({
      id: preferenceId,
      userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException("Préférence non trouvée");
    }
  }

  // Méthodes pour les favoris
  async addToFavorites(userId: number, eventData: any): Promise<UserFavorite> {
    // Vérifier si l'événement n'est pas déjà en favoris
    const existingFavorite = await this.userFavoriteRepository.findOne({
      where: { 
        userId, 
        eventId: eventData.eventId 
      }
    });

    if (existingFavorite) {
      throw new BadRequestException("Cet événement est déjà dans vos favoris");
    }

    const favorite = this.userFavoriteRepository.create({
      userId,
      eventId: eventData.eventId,
      eventName: eventData.eventName,
      eventDate: eventData.eventDate,
      eventVenue: eventData.eventVenue,
      eventCity: eventData.eventCity,
      eventImage: eventData.eventImage,
      eventUrl: eventData.eventUrl
    });

    return this.userFavoriteRepository.save(favorite);
  }

  async removeFromFavorites(userId: number, eventId: string): Promise<void> {
    const result = await this.userFavoriteRepository.delete({
      userId,
      eventId
    });

    if (result.affected === 0) {
      throw new NotFoundException("Favori non trouvé");
    }
  }

  async getUserFavorites(userId: number): Promise<UserFavorite[]> {
    return this.userFavoriteRepository.find({
      where: { userId },
      order: { createdAt: "DESC" }
    });
  }

  async isEventInFavorites(userId: number, eventId: string): Promise<boolean> {
    const favorite = await this.userFavoriteRepository.findOne({
      where: { userId, eventId }
    });
    return !!favorite;
  }
}
