json.(pokemon, :id, :attack, :defense, :image_url, :moves, :name, :poke_type)
if display_toys
  json.toys(toys) do |toy|
    json.partial! 'toys/toy', toy: toy
  end
end
