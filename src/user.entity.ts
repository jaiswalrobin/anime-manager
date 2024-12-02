import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from './enums/user-role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STANDARD })
  role: UserRole;

  //   @Column()
  //   username: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ nullable: true })
  isActive: boolean;

  @Column({ default: 0 })
  failedAttempts: number;

  @Column({ default: 0 })
  loginCount: number;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationTokenHash: string;

  @Column({ type: 'timestamp', nullable: true })
  emailVerificationTokenExpiry: Date;

  @Column({ nullable: true })
  emailVerificationTokenSalt: string;

  @Column({ nullable: true })
  resetToken: string;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpiry: Date;

  @Column({ nullable: true })
  salt: string;
}
