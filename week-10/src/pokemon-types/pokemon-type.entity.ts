import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Pokemon } from '../pokemons/pokemon.entity.js';

@Entity({ name: 'types' })
export class PokemonType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  color: string;

  @ManyToMany(() => Pokemon, (pokemon) => pokemon.types)
  pokemons: Pokemon[];
}
