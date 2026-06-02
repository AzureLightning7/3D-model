export type ProjectStage =
  | "room_uploaded"
  | "room_dna_generated"
  | "concepts_generated"
  | "design_selected"
  | "editing"
  | "visualized_3d"
  | "completed";

export const PROJECT_STAGES: Array<{
  id: ProjectStage;
  label: string;
  description: string;
}> = [
  { id: "room_uploaded", label: "Room Uploaded", description: "Room photo and baseline details captured." },
  { id: "room_dna_generated", label: "Room DNA Generated", description: "Personalization profile is available." },
  { id: "concepts_generated", label: "Concepts Generated", description: "Initial design concepts created." },
  { id: "design_selected", label: "Design Selected", description: "A concept has been chosen to develop." },
  { id: "editing", label: "Editing", description: "Layout and items being refined." },
  { id: "visualized_3d", label: "3D Visualization", description: "Experience the room in 3D and export previews." },
  { id: "completed", label: "Completed", description: "Project is ready to live in." },
];

export function stageIndex(stage: ProjectStage) {
  return Math.max(
    0,
    PROJECT_STAGES.findIndex((s) => s.id === stage),
  );
}

export function maxStage(a: ProjectStage, b: ProjectStage): ProjectStage {
  return stageIndex(a) >= stageIndex(b) ? a : b;
}

