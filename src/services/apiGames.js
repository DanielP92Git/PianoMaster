import supabase from "./supabase";

export async function getGames() {
  const { data, error } = await supabase.from("games").select("*");

  if (error) {
    console.error(error.message);
    throw new Error("Games could not be fetched");
  }

  return data;
}