// Folder console — the interactive surface for the expert-folder (judgment-units) system.
// Its own tab (not the /system anatomy page). Where Nick sees + acts on a folder's judgment
// library: the current recipes/options/rulings, the proposed-unit ratify/veto/route queue, and
// the folder's track record. Pure-canon reads; mutations go through app/api/folder.

import {
  getFolder, getRecipes, getOptions, getRulings, getProposedUnits, getTrackRecord,
} from "@/lib/queries/expertFolder";
import FolderSurface from "./FolderSurface";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// v1: the RevOps folder is the only live one. When more folders land, this becomes a
// route param (/folder/[slug]); for now it's a constant so the page is a plain read.
const FOLDER_SLUG = "revops";

export default async function FolderPage() {
  try {
    const [folder, recipes, options, rulings, proposed, trackRecord] = await Promise.all([
      getFolder(FOLDER_SLUG),
      getRecipes(FOLDER_SLUG),
      getOptions(FOLDER_SLUG),
      getRulings(FOLDER_SLUG),
      getProposedUnits(FOLDER_SLUG),
      getTrackRecord(FOLDER_SLUG),
    ]);
    return (
      <FolderSurface
        folderSlug={FOLDER_SLUG}
        folder={folder}
        recipes={recipes}
        options={options}
        rulings={rulings}
        proposed={proposed}
        trackRecord={trackRecord}
      />
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return <main className="p-6 font-mono text-sm text-bad">canon_engine: {msg}</main>;
  }
}
