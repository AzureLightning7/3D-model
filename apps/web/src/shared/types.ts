// Mirrors apps/api/app/contexts/scene/domain/scene_graph.py
// In Phase 2 this becomes generated from OpenAPI.

export type Vec3 = { x: number; y: number; z: number };

export type Room = {
  widthM: number;
  depthM: number;
  heightM: number;
};

export type SceneItem = {
  id: string;
  catalogId: string;
  name: string;
  position: Vec3;
  rotationYRad: number;
  scale: number;
  locked: boolean;
};

export type Scene = {
  schemaVersion: number;
  room: Room;
  items: SceneItem[];
  version: number;
};

export type User = {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
};

export type AuthResponse = { user: User; tokens: TokenPair };

// --- Edit ops (mirrors Pydantic discriminated union) -----------------------
export type MoveItemOp = { op: "MOVE_ITEM"; itemId: string; to: Vec3 };
export type RotateItemOp = { op: "ROTATE_ITEM"; itemId: string; rotationYRad: number };
export type AddItemOp = { op: "ADD_ITEM"; item: SceneItem };
export type DeleteItemOp = { op: "DELETE_ITEM"; itemId: string };
export type LockItemOp = { op: "LOCK_ITEM"; itemId: string; locked: boolean };
export type SwapItemOp = { op: "SWAP_ITEM"; itemId: string; newCatalogId: string };
export type EditOp =
  | MoveItemOp
  | RotateItemOp
  | AddItemOp
  | DeleteItemOp
  | LockItemOp
  | SwapItemOp;

export type CatalogProduct = {
  id: string;
  name: string;
  category: string;
  color: string;
  widthM: number;
  depthM: number;
  heightM: number;
  priceCny: number;
  retailerUrl: string;
};

export type RankedProduct = CatalogProduct & { distance: number };

export type SurveyOption = { id: string; label: string; subtitle: string };
export type SurveyQuestion = { id: string; title: string; options: SurveyOption[] };
export type Survey = { questions: SurveyQuestion[] };
export type SurveyAnswer = { questionId: string; optionId: string };

export type StyleProfile = {
  id: string;
  ownerId: string;
  embedding: number[];
  sourceAnswers: SurveyAnswer[];
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  ownerId: string;
  name: string;
  roomWidthM: number;
  roomDepthM: number;
  roomHeightM: number;
  scene: Scene;
  createdAt: string;
  updatedAt: string;
};
