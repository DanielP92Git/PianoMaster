import supabase from "./supabase";

export async function getAvatar() {
  const { data, error } = await supabase.from("avatars").select("*");

  if (error) {
    console.error(error.message);
    throw new Error("Games Library could not be fetched");
  }

  return data;
}
