import type {
  Asset,
  User,
  Catalog,
  Team,
  Policy,
  Change,
  Audit,
} from "@relaydesk/contracts";
export interface Reference {
  teams: Team[];
  catalog: Catalog[];
  assets: Asset[];
  agents: User[];
}
export interface Settings {
  users: User[];
  teams: Team[];
  policies: Policy[];
  catalog: Catalog[];
}
export interface ChangeDetail extends Change {
  history: Audit[];
}
