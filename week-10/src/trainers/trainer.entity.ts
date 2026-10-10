import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Pokemon } from '../pokemons/pokemon.entity.js';

@Entity({ name: 'trainers' })
export class Trainer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  hometown: string;

  @OneToMany(() => Pokemon, (pokemon) => pokemon.trainer)
  pokemons: Pokemon[];
}
