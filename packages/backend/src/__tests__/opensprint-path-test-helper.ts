import path from "path";
import { setFeedbackAssetsBaseDirForTesting } from "../services/feedback-store.service.js";
import { setGlobalSettingsPathForTesting } from "../services/global-settings.service.js";
import { setProjectIndexPathForTesting } from "../services/project-index.js";
import { setSettingsStorePathForTesting } from "../services/settings-store.service.js";

export interface OpenSprintTestPaths {
  opensprintDir: string;
  globalSettingsPath: string;
  projectIndexPath: string;
  settingsStorePath: string;
  feedbackAssetsDir: string;
}

export function getOpenSprintTestPaths(rootDir: string): OpenSprintTestPaths {
  const opensprintDir = path.join(rootDir, ".opensprint");
  return {
    opensprintDir,
    globalSettingsPath: path.join(opensprintDir, "global-settings.json"),
    projectIndexPath: path.join(opensprintDir, "projects.json"),
    settingsStorePath: path.join(opensprintDir, "settings.json"),
    feedbackAssetsDir: path.join(opensprintDir, "feedback-assets"),
  };
}

export function pinOpenSprintPathsForTesting(rootDir: string): OpenSprintTestPaths {
  const paths = getOpenSprintTestPaths(rootDir);
  setGlobalSettingsPathForTesting(paths.globalSettingsPath);
  setProjectIndexPathForTesting(paths.projectIndexPath);
  setSettingsStorePathForTesting(paths.settingsStorePath);
  setFeedbackAssetsBaseDirForTesting(paths.feedbackAssetsDir);
  return paths;
}

export function resetOpenSprintPathsForTesting(): void {
  setGlobalSettingsPathForTesting(null);
  setProjectIndexPathForTesting(null);
  setSettingsStorePathForTesting(null);
  setFeedbackAssetsBaseDirForTesting(null);
}
