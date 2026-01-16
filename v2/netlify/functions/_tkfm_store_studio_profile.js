import fs from "fs";
import path from "path";
import { readJson, writeJson } from "./_tkfm_store_studio.js";

export function profilePath(customerId){
  const STORE_DIR = path.join(process.cwd(), ".tkfm_store");
  const STUDIO_DIR = path.join(STORE_DIR, "studio");
  return path.join(STUDIO_DIR, "profiles", `${customerId}.json`);
}

export function readProfile(customerId){
  return readJson(profilePath(customerId), { customerId });
}

export function writeProfile(customerId, data){
  writeJson(profilePath(customerId), data);
}
