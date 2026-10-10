import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PokemonType } from '../pokemon-types/pokemon-type.entity.js';
import { Trainer } from '../trainers/trainer.entity.js';

@Entity({ name: 'pokemons' })
export class Pokemon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'integer' })
  height: number;

  @Column({ type: 'integer' })
  weight: number;

  @Column()
  imageUrl: string;

  @ManyToMany(() => PokemonType, (type) => type.pokemons, { eager: true })
  @JoinTable({
    name: 'pokemon_type_links',
    joinColumn: { name: 'pokemon_id' },
    inverseJoinColumn: { name: 'type_id' },
  })
  types: PokemonType[];

  @ManyToOne(() => Trainer, (trainer) => trainer.pokemons, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  })
  trainer: Trainer | null;
}
