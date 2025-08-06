import { Injectable } from "@nestjs/common";
import { User } from "./user.entity";

@Injectable()
export class UsersService {
  private readonly users: User[] = [
    {
      id: 1,
      email: "john@example.com",
      password: "$2b$10$YQT8qZ8X1Z8X1Z8X1Z8X1O7G7G7G7G7G7G7G7G7G7G7G7G7G7G7G7G",
    },
    {
      id: 2,
      email: "maria@example.com",
      password: "$2b$10$YQT8qZ8X1Z8X1Z8X1Z8X1O7G7G7G7G7G7G7G7G7G7G7G7G7G7G7G7GG",
    },
  ];

  async findOne(email: string): Promise<User | undefined> {
    return this.users.find((user) => user.email === email);
  }

  async create(email: string, password: string): Promise<User> {
    const newUser: User = {
      id: this.users.length + 1,
      email,
      password,
    };
    this.users.push(newUser);
    return newUser;
  }

  async getUserProfileById(id: number): Promise<Omit<User, "password"> | null> {
    const user = this.users.find((user) => user.id === id);
    if (!user) {
      return null;
    }
    const { password, ...userProfile } = user;
    return userProfile;
  }
}
