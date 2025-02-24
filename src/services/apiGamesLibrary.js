import supabase from "./supabase";

export async function getGamesCategories() {
  const { data, error } = await supabase.from("games_categories").select("*");

  if (error) {
    console.error(error.message);
    throw new Error("Games Library could not be fetched");
  }

  return data;
}
