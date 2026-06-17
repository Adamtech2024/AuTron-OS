import type { StudioProject } from "./types";

const DB_NAME = "autron-studio";
const DB_VERSION = 1;
const PROJECT_STORE = "projects";
const LAST_PROJECT_KEY = "autron-studio:last-project";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(PROJECT_STORE)) {
        database.createObjectStore(PROJECT_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProject(project: StudioProject) {
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(PROJECT_STORE, "readwrite");
    transaction.objectStore(PROJECT_STORE).put(project);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  localStorage.setItem(LAST_PROJECT_KEY, project.id);
  database.close();
}

export async function loadProjects(): Promise<StudioProject[]> {
  const database = await openDatabase();
  const projects = await new Promise<StudioProject[]>((resolve, reject) => {
    const transaction = database.transaction(PROJECT_STORE, "readonly");
    const request = transaction.objectStore(PROJECT_STORE).getAll();
    request.onsuccess = () => resolve(request.result as StudioProject[]);
    request.onerror = () => reject(request.error);
  });

  database.close();
  return projects;
}
