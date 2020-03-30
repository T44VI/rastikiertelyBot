import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany,
  ManyToMany
} from "typeorm";
import { Status } from "./Status";
import { Person } from "./Person";
import { Chat } from "./Chat";

@Entity()
export class Group {
  @PrimaryGeneratedColumn("uuid")
  uuid: string;

  @Column()
  name: string;

  @Column()
  number: number;

  @OneToMany(
    type => Status,
    groupstatus => groupstatus.group,
    {
      cascade: true
    }
  )
  status: Status[];

  @ManyToMany(
    type => Person,
    person => person.groups
  )
  members: Person[];

  @OneToOne(
    type => Chat,
    chat => chat.group
  )
  @JoinColumn()
  chat: Chat;
}
