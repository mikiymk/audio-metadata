export type CommonKeys =
  | "title"
  | "album"
  | "artist"
  | "albumartist"
  | "composer"
  | "track"
  | "totaltracks" // total number of tracks in disc
  | "disc"
  | "totaldiscs" // total number of discs in album
  | "year"
  | "encoder" // encoding software
  | "genre"
  | "comment"
  | "picture"; // todo

export const mapTag = (tags: Record<string, string>, mapping: Record<string, CommonKeys>, key: string, value: string) => {
  if (mapping[key]) {
    tags[mapping[key]] = value;
  }
  tags[key] = value;
};
