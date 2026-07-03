// Barrel re-export of API contract types. Mirrors the FastAPI backend schemas.
// Any contract change lands here or in `@/lib/api/types` — do not redefine
// these shapes inside feature modules.
export * from "@/lib/api/types";
